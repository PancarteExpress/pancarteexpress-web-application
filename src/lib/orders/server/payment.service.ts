import 'server-only';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { after } from 'next/server';
import { sendReceipts } from '@/features/checkout/emailSender/sendReceipts';
import { planServicesSettlement } from '../billing';

const settlingPaymentSelect = {
  id: true,
  kind: true,
  status: true,
  total: true,
  allocations: {
    select: { id: true, total: true, order: { select: { id: true, orderNumber: true, status: true } } },
  },
} satisfies Prisma.PaymentSelect;

type SettlingPayment = Prisma.PaymentGetPayload<{ select: typeof settlingPaymentSelect }>;

export async function handlePaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { paymentIntentId: intent.id },
    select: settlingPaymentSelect,
  });

  if (!payment) {
    await refund(intent, 'paymentNotFound');
    return;
  }

  // Doublon d'événement : déjà traité
  if (payment.status === 'SUCCEEDED') return;

  // PaymentIntent remplacé entre-temps (ex. prix modifié) : le client ne doit pas payer deux fois
  if (payment.status === 'CANCELLED') {
    await refund(intent, 'paymentCancelled');
    return;
  }

  // Commandes supprimées par le cron : les allocations sont parties avec, par cascade
  if (payment.allocations.length === 0) {
    await refund(intent, 'ordersDeleted');
    return;
  }

  if (intent.amount_received !== payment.total || intent.currency !== 'cad') {
    // Incohérence : ne jamais marquer payé, vérification manuelle requise
    console.error('[payment] Paiement incohérent, vérification manuelle requise', {
      orderNumbers: payment.allocations.map((a) => a.order.orderNumber),
      kind: payment.kind,
      expected: { total: payment.total },
      received: { paymentIntentId: intent.id, amount: intent.amount_received, currency: intent.currency },
    });
    return;
  }

  switch (payment.kind) {
    case 'PRODUCTS':
      await settleProductsPayment(intent, payment);
      return;
    case 'SERVICES':
      await settleServicesPayment(intent, payment);
      return;
  }
}

export function handlePaymentFailed(intent: Stripe.PaymentIntent): void {
  // Aucun changement en BD : le Payment reste PENDING et le client peut réessayer
  console.warn('[payment] Paiement refusé', {
    kind: intent.metadata.kind,
    orderNumbers: intent.metadata.orderNumbers ?? intent.metadata.orderNumber,
    paymentIntentId: intent.id,
    reason: intent.last_payment_error?.code ?? 'unknown',
  });
}

/* ── Produits (checkout : toujours une seule commande) ────────── */

async function settleProductsPayment(intent: Stripe.PaymentIntent, payment: SettlingPayment): Promise<void> {
  const order = payment.allocations[0]?.order;
  if (!order) return; // garanti par handlePaymentSucceeded

  // Commande annulée entre-temps : le client ne doit pas payer pour rien
  if (order.status !== 'AWAITING_PAYMENT' && order.status !== 'PAID') {
    await refund(intent, `orderStatus:${order.status}`);
    return;
  }

  const paidAt = new Date();

  const settled = await prisma.$transaction(async (tx) => {
    // Conditionnel : si deux événements arrivent en même temps, un seul applique la mise à jour
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'SUCCEEDED', paidAt },
    });
    if (count === 0) return false;

    // Transition : ancien champ conservé jusqu'à l'étape 6
    await tx.order.updateMany({
      where: { id: order.id, status: 'AWAITING_PAYMENT' },
      data: { status: 'PAID', paidAt },
    });
    return true;
  });

  if (!settled) return; // déjà traité par un autre événement : pas de second envoi

  const paidOrderId = order.id;
  after(() => sendReceipts(paidOrderId));
}

/* ── Services (une ou plusieurs commandes) ────────────────────── */

async function settleServicesPayment(intent: Stripe.PaymentIntent, payment: SettlingPayment): Promise<void> {
  const orderIds = payment.allocations.map((a) => a.order.id);
  const paidAt = new Date();

  const plan = await prisma.$transaction(async (tx) => {
    // Verrou : deux paiements concurrents ne peuvent pas solder la même commande
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" IN (${Prisma.join(orderIds)}) FOR UPDATE`;

    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'SUCCEEDED', paidAt },
    });
    if (count === 0) return null; // déjà traité par un autre événement

    // État relu sous verrou : annulation ou autre paiement survenu depuis la lecture initiale
    const orders = await tx.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        status: true,
        allocations: {
          where: { paymentId: { not: payment.id }, payment: { kind: 'SERVICES', status: 'SUCCEEDED' } },
          select: { id: true },
          take: 1,
        },
      },
    });

    const settlement = planServicesSettlement(
      payment.allocations,
      orders.map((o) => ({ id: o.id, status: o.status, paidByAnotherPayment: o.allocations.length > 0 })),
    );

    // Retirer l'allocation : la commande n'est plus couverte par ce paiement
    if (settlement.refused.length > 0) {
      await tx.paymentAllocation.deleteMany({ where: { id: { in: settlement.refused.map((a) => a.id) } } });
    }

    if (settlement.accepted.length === 0) {
      await tx.payment.update({ where: { id: payment.id }, data: { status: 'CANCELLED', paidAt: null } });
    } else {
      // Services seulement : la commande passe à PAID. Commande mixte : déjà PAID (produits).
      await tx.order.updateMany({
        where: { id: { in: settlement.accepted.map((a) => a.order.id) }, status: 'PENDING' },
        data: { status: 'PAID' },
      });
    }
    return settlement;
  });

  if (!plan || plan.refused.length === 0) return;

  const orderNumbers = plan.refused.map((a) => a.order.orderNumber).join(',');
  try {
    await refund(intent, `servicesRejected:${orderNumbers}`, plan.refundAmount);
  } catch (error) {
    // Le paiement est déjà marqué : un nouvel envoi du webhook ne relancerait pas ce remboursement
    console.error(
      '[payment] Remboursement partiel échoué, traitement manuel requis',
      { paymentIntentId: intent.id, amount: plan.refundAmount, orderNumbers },
      error,
    );
  }
}

/* ── Remboursement ────────────────────────────────────────────── */

async function refund(intent: Stripe.PaymentIntent, reason: string, amount?: number): Promise<void> {
  console.error(`[payment] Remboursement automatique (${reason})`, { paymentIntentId: intent.id, amount });
  await stripe.refunds.create(
    { payment_intent: intent.id, amount, metadata: { reason: reason.slice(0, 500) } },
    // Si Stripe renvoie l'événement, pas de second remboursement
    { idempotencyKey: `refund-${intent.id}` },
  );
}