import 'server-only';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { calculateTaxes } from '@/lib/pricing/taxes';

/** Erreur métier : son message peut être montré à l'utilisateur */
export class ServicesPaymentError extends Error {}

export interface ServicesPaymentSession {
  clientSecret: string;
  orderNumber: number;
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
}

// Statuts où le client peut encore confirmer le paiement
const REUSABLE_STATUSES: ReadonlySet<Stripe.PaymentIntent.Status> = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]);

/* ── Point d'entrée ───────────────────────────────────────────── */

export async function createServicesPayment(orderId: string, userId: string): Promise<ServicesPaymentSession> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      email: true,
      status: true,
      serviceRequests: {
        select: { addresses: { select: { services: { select: { price: true, status: true } } } } },
      },
      payments: {
        where: { kind: 'SERVICES', status: { in: ['PENDING', 'SUCCEEDED'] } },
        select: { id: true, status: true, subtotal: true, total: true, paymentIntentId: true },
      },
    },
  });

  // Même message pour « introuvable » et « pas à vous » : on ne révèle pas l'existence d'une commande
  if (!order || order.userId !== userId) throw new ServicesPaymentError('Commande introuvable.');
  if (order.status === 'CANCELLED') throw new ServicesPaymentError('Cette commande a été annulée.');
  if (order.payments.some((p) => p.status === 'SUCCEEDED')) {
    throw new ServicesPaymentError('Les services de cette commande sont déjà payés.');
  }

  const services = order.serviceRequests
    .flatMap((r) => r.addresses.flatMap((a) => a.services))
    .filter((s) => s.status !== 'CANCELLED');

  if (services.length === 0) throw new ServicesPaymentError('Aucun service à payer.');

  const prices = services.map((s) => s.price);
  if (prices.some((p) => p === null)) {
    throw new ServicesPaymentError('Certains prix ne sont pas encore disponibles.');
  }

  const subtotal = prices.reduce<number>((sum, p) => sum + (p ?? 0), 0);
  const { tps, tvq } = calculateTaxes(subtotal);
  const quote = { orderNumber: order.orderNumber, subtotal, tps, tvq, total: subtotal + tps + tvq };

  const pending = order.payments.find((p) => p.status === 'PENDING');
  if (pending) {
    if (pending.subtotal === quote.subtotal && pending.total === quote.total) {
      const intent = await stripe.paymentIntents.retrieve(pending.paymentIntentId);
      if (intent.client_secret && REUSABLE_STATUSES.has(intent.status)) {
        return { ...quote, clientSecret: intent.client_secret };
      }
      if (intent.status === 'processing' || intent.status === 'succeeded') {
        throw new ServicesPaymentError('Un paiement est déjà en cours de traitement.');
      }
      // Annulé côté Stripe : on le remplace ci-dessous
    }
    await cancelPayment(pending);
  }

  return createIntent(order, quote);
}

/** Appelée quand le superAdmin modifie un prix : le montant en attente n'est plus valide */
export async function cancelPendingServicesPayment(orderId: string): Promise<void> {
  const pending = await prisma.payment.findMany({
    where: { orderId, kind: 'SERVICES', status: 'PENDING' },
    select: { id: true, paymentIntentId: true },
  });
  for (const payment of pending) await cancelPayment(payment);
}

/* ── Stripe ───────────────────────────────────────────────────── */

async function createIntent(
  order: { id: string; orderNumber: number; email: string },
  quote: Omit<ServicesPaymentSession, 'clientSecret'>,
): Promise<ServicesPaymentSession> {
  // Change à chaque nouveau paiement (les annulés comptent) ; identique pour deux clics simultanés
  const attempt = await prisma.payment.count({ where: { orderId: order.id, kind: 'SERVICES' } });

  const intent = await stripe.paymentIntents.create(
    {
      amount: quote.total,
      currency: 'cad',
      payment_method_types: ['card'],
      receipt_email: order.email,
      metadata: { orderId: order.id, orderNumber: String(order.orderNumber), kind: 'SERVICES' },
    },
    { idempotencyKey: `services-${order.id}-${attempt}` },
  );
  if (!intent.client_secret) throw new Error('client_secret absent');

  try {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        kind: 'SERVICES',
        subtotal: quote.subtotal,
        tps: quote.tps,
        tvq: quote.tvq,
        total: quote.total,
        paymentIntentId: intent.id,
      },
    });
  } catch (error) {
    // Deux clics simultanés : même clé → même PaymentIntent, déjà enregistré par l'autre requête
    const alreadySaved = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    // Sinon, on laisse le PaymentIntent : un nouvel essai le récupérera grâce à la même clé
    if (!alreadySaved) throw error;
  }

  return { ...quote, clientSecret: intent.client_secret };
}

async function cancelPayment(payment: { id: string; paymentIntentId: string }): Promise<void> {
  try {
    await stripe.paymentIntents.cancel(payment.paymentIntentId);
  } catch (error) {
    const intent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
    if (intent.status === 'succeeded' || intent.status === 'processing') {
      throw new ServicesPaymentError('Un paiement est en cours pour cette commande. Réessayez dans quelques instants.');
    }
    if (intent.status !== 'canceled') throw error;
  }

  await prisma.payment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
}