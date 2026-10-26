import 'server-only';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { after } from 'next/server';
import { sendReceipts } from '@/features/checkout/emailSender/sendReceipts';

async function settleProductsPayment(
  intent: Stripe.PaymentIntent,
  paymentId: string,
  order: { id: string; orderNumber: number; status: string },
): Promise<void> {
  // Commande annulée entre-temps : le client ne doit pas payer pour rien
  if (order.status !== 'AWAITING_PAYMENT' && order.status !== 'PAID') {
    await refund(intent, `orderStatus:${order.status}`);
    return;
  }

  const paidAt = new Date();

  const settled = await prisma.$transaction(async (tx) => {
    // Conditionnel : si deux événements arrivent en même temps, un seul applique la mise à jour
    const { count } = await tx.payment.updateMany({
      where: { id: paymentId, status: 'PENDING' },
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

async function settleServicesPayment(
  intent: Stripe.PaymentIntent,
  paymentId: string,
  order: { id: string; orderNumber: number; status: string },
): Promise<void> {
  // Commande annulée entre-temps : le client ne doit pas payer pour rien
  if (order.status === 'CANCELLED') {
    await refund(intent, 'orderStatus:CANCELLED');
    return;
  }

  const paidAt = new Date();

  const outcome = await prisma.$transaction(async (tx) => {
    // Un autre paiement de services a déjà réussi : ce second paiement serait un doublon
    const alreadyPaid = await tx.payment.count({
      where: { orderId: order.id, kind: 'SERVICES', status: 'SUCCEEDED', id: { not: paymentId } },
    });
    if (alreadyPaid > 0) return 'duplicate' as const;

    // Conditionnel : si deux événements arrivent en même temps, un seul applique la mise à jour
    const { count } = await tx.payment.updateMany({
      where: { id: paymentId, status: 'PENDING' },
      data: { status: 'SUCCEEDED', paidAt },
    });
    if (count === 0) return 'alreadySettled' as const;

    // Services seulement : la commande passe à PAID. Commande mixte : déjà PAID (produits).
    await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'PAID' },
    });
    return 'settled' as const;
  });

  if (outcome === 'duplicate') {
    await refund(intent, 'servicesAlreadyPaid');
  }
}

export async function handlePaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { paymentIntentId: intent.id },
    select: {
      id: true,
      kind: true,
      status: true,
      total: true,
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  });

  // Commande supprimée par le cron (le Payment part avec, par cascade) ou paiement inconnu
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

  if (intent.amount_received !== payment.total || intent.currency !== 'cad') {
    // Incohérence : ne jamais marquer payé, vérification manuelle requise
    console.error('[payment] Paiement incohérent, vérification manuelle requise', {
      orderNumber: payment.order.orderNumber,
      kind: payment.kind,
      expected: { total: payment.total },
      received: { paymentIntentId: intent.id, amount: intent.amount_received, currency: intent.currency },
    });
    return;
  }

  switch (payment.kind) {
    case 'PRODUCTS':
      await settleProductsPayment(intent, payment.id, payment.order);
      return;
    case 'SERVICES':
      await settleServicesPayment(intent, payment.id, payment.order);
      return;
  }
}



export function handlePaymentFailed(intent: Stripe.PaymentIntent): void {
  // Aucun changement en BD : le Payment reste PENDING et le client peut réessayer
  console.warn('[payment] Paiement refusé', {
    orderId: intent.metadata.orderId,
    kind: intent.metadata.kind,
    paymentIntentId: intent.id,
    reason: intent.last_payment_error?.code ?? 'unknown',
  });
}

async function refund(intent: Stripe.PaymentIntent, reason: string): Promise<void> {
  console.error(`[payment] Remboursement automatique (${reason})`, { paymentIntentId: intent.id });
  await stripe.refunds.create(
    { payment_intent: intent.id, metadata: { reason } },
    // Si Stripe renvoie l'événement, pas de second remboursement
    { idempotencyKey: `refund-${intent.id}` },
  );
}