import 'server-only';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { coversExactly, quoteOrderServices, sumAmounts, type Amounts, type QuoteRefusal } from '../billing';

/** Erreur métier : son message peut être montré à l'utilisateur */
export class ServicesPaymentError extends Error {}

export interface ServicesPaymentSession extends Amounts {
  clientSecret: string;
  orderNumbers: number[];
}

interface QuoteLine extends Amounts {
  orderId: string;
  orderNumber: number;
}

interface Quote extends Amounts {
  lines: QuoteLine[];
}

// Statuts où le client peut encore confirmer le paiement
const REUSABLE_STATUSES: ReadonlySet<Stripe.PaymentIntent.Status> = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]);

const REFUSAL_MESSAGES: Record<QuoteRefusal, string> = {
  cancelled: 'annulée.',
  alreadyPaid: 'services déjà payés.',
  noServices: 'aucun service à payer.',
  priceMissing: 'certains prix ne sont pas encore disponibles.',
};

const payableOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  serviceRequests: {
    select: { addresses: { select: { services: { select: { price: true, status: true } } } } },
  },
  allocations: {
    where: { payment: { kind: 'SERVICES', status: { in: ['PENDING', 'SUCCEEDED'] } } },
    select: {
      payment: {
        select: {
          id: true,
          status: true,
          total: true,
          paymentIntentId: true,
          allocations: { select: { orderId: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type PayableOrder = Prisma.OrderGetPayload<{ select: typeof payableOrderSelect }>;
type LinkedPayment = PayableOrder['allocations'][number]['payment'];

/* ── Point d'entrée ───────────────────────────────────────────── */

export async function createServicesPayment(
  orderIds: readonly string[],
  payerId: string,
): Promise<ServicesPaymentSession> {
  const ids = [...new Set(orderIds)];
  if (ids.length === 0) throw new ServicesPaymentError('Aucune commande sélectionnée.');

  const [payer, orders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: payerId }, select: { email: true } }),
    prisma.order.findMany({
      // billedToId dans le WHERE : une commande facturée à quelqu'un d'autre est simplement absente
      where: { id: { in: ids }, billedToId: payerId },
      select: payableOrderSelect,
      orderBy: { orderNumber: 'asc' },
    }),
  ]);

  // Même message pour « introuvable » et « pas à vous » : on ne révèle pas l'existence d'une commande
  if (orders.length !== ids.length) throw new ServicesPaymentError('Commande introuvable.');

  const lines = orders.map(toQuoteLine);
  const quote: Quote = { lines, ...sumAmounts(lines) };

  const pendings = uniqueById(
    orders.flatMap((o) => o.allocations.map((a) => a.payment)).filter((p) => p.status === 'PENDING'),
  );

  // Réutilisable seulement s'il couvre exactement la même sélection, au même montant
  const reusable = pendings.find(
    (p) => p.total === quote.total && coversExactly(p.allocations.map((a) => a.orderId), ids),
  );
  if (reusable) {
    const intent = await stripe.paymentIntents.retrieve(reusable.paymentIntentId);
    if (intent.client_secret && REUSABLE_STATUSES.has(intent.status)) {
      return toSession(quote, intent.client_secret);
    }
    if (intent.status === 'processing' || intent.status === 'succeeded') {
      throw new ServicesPaymentError('Un paiement est déjà en cours de traitement.');
    }
    // Annulé côté Stripe : remplacé ci-dessous
  }

  // Une commande ne doit jamais être couverte par deux paiements en attente
  for (const payment of pendings) await cancelPayment(payment);

  return createIntent(quote, payerId, payer.email);
}

/** Appelée quand le superAdmin modifie un prix : les montants en attente ne sont plus valides */
export async function cancelPendingServicesPayment(orderId: string): Promise<void> {
  const pending = await prisma.payment.findMany({
    where: { kind: 'SERVICES', status: 'PENDING', allocations: { some: { orderId } } },
    select: { id: true, paymentIntentId: true },
  });
  for (const payment of pending) await cancelPayment(payment);
}

/* ── Calcul ───────────────────────────────────────────────────── */

function toQuoteLine(order: PayableOrder): QuoteLine {
  const result = quoteOrderServices({
    status: order.status,
    hasSucceededServicesPayment: order.allocations.some((a) => a.payment.status === 'SUCCEEDED'),
    services: order.serviceRequests.flatMap((r) => r.addresses.flatMap((a) => a.services)),
  });

  if (!result.ok) {
    throw new ServicesPaymentError(`Commande n° ${order.orderNumber} : ${REFUSAL_MESSAGES[result.reason]}`);
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    subtotal: result.subtotal,
    tps: result.tps,
    tvq: result.tvq,
    total: result.total,
  };
}

const toSession = (quote: Quote, clientSecret: string): ServicesPaymentSession => ({
  clientSecret,
  orderNumbers: quote.lines.map((l) => l.orderNumber),
  subtotal: quote.subtotal,
  tps: quote.tps,
  tvq: quote.tvq,
  total: quote.total,
});

const uniqueById = (payments: LinkedPayment[]): LinkedPayment[] => [
  ...new Map(payments.map((p) => [p.id, p])).values(),
];

/* ── Stripe ───────────────────────────────────────────────────── */

async function createIntent(quote: Quote, payerId: string, email: string): Promise<ServicesPaymentSession> {
  // Change à chaque nouveau paiement du payeur ; identique pour deux clics simultanés sur la même sélection
  const attempt = await prisma.payment.count({ where: { payerId, kind: 'SERVICES' } });
  const selection = createHash('sha256')
    .update(quote.lines.map((l) => l.orderId).sort().join(','))
    .digest('hex')
    .slice(0, 32);

  const intent = await stripe.paymentIntents.create(
    {
      amount: quote.total,
      currency: 'cad',
      payment_method_types: ['card'],
      receipt_email: email,
      // Stripe limite chaque valeur à 500 caractères
      metadata: {
        kind: 'SERVICES',
        payerId,
        orderNumbers: quote.lines.map((l) => l.orderNumber).join(',').slice(0, 500),
      },
    },
    { idempotencyKey: `services-${selection}-${quote.total}-${attempt}` },
  );
  if (!intent.client_secret) throw new Error('client_secret absent');

  try {
    await prisma.payment.create({
      data: {
        payerId,
        kind: 'SERVICES',
        subtotal: quote.subtotal,
        tps: quote.tps,
        tvq: quote.tvq,
        total: quote.total,
        paymentIntentId: intent.id,
        allocations: {
          create: quote.lines.map((l) => ({
            orderId: l.orderId,
            subtotal: l.subtotal,
            tps: l.tps,
            tvq: l.tvq,
            total: l.total,
          })),
        },
      },
    });
  } catch (error) {
    // Deux clics simultanés : même clé → même PaymentIntent, déjà enregistré par l'autre requête
    const alreadySaved = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    // Sinon, on laisse le PaymentIntent : un nouvel essai le récupérera grâce à la même clé
    if (!alreadySaved) throw error;
  }

  return toSession(quote, intent.client_secret);
}

async function cancelPayment(payment: { id: string; paymentIntentId: string }): Promise<void> {
  try {
    await stripe.paymentIntents.cancel(payment.paymentIntentId);
  } catch (error) {
    const intent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
    if (intent.status === 'succeeded' || intent.status === 'processing') {
      throw new ServicesPaymentError('Un paiement est en cours pour ces commandes. Réessayez dans quelques instants.');
    }
    if (intent.status !== 'canceled') throw error;
  }

  await prisma.payment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
}