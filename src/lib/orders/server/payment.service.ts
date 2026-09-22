import 'server-only';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';

export async function handlePaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const orderId = intent.metadata.orderId;
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, status: true, total: true, paymentIntentId: true },
      })
    : null;

  // Commande supprimée par le cron (ou paiement sans commande) : on rend l'argent
  if (!order) {
    await refund(intent, 'orderNotFound');
    return;
  }

  // Doublon d'événement : déjà traité
  if (order.status === 'PAID') return;

  // Commande annulée entre-temps : le client ne doit pas payer pour rien
  if (order.status !== 'AWAITING_PAYMENT') {
    await refund(intent, `orderStatus:${order.status}`);
    return;
  }

  if (order.paymentIntentId !== intent.id || intent.amount_received !== order.total || intent.currency !== 'cad') {
    // Incohérence : ne jamais marquer payé, vérification manuelle requise
    console.error('[payment] Paiement incohérent, vérification manuelle requise', {
      orderNumber: order.orderNumber,
      expected: { paymentIntentId: order.paymentIntentId, total: order.total },
      received: { paymentIntentId: intent.id, amount: intent.amount_received, currency: intent.currency },
    });
    return;
  }

  // Conditionnel : si deux événements arrivent en même temps, un seul applique la mise à jour
  const { count } = await prisma.order.updateMany({
    where: { id: order.id, status: 'AWAITING_PAYMENT' },
    data: { status: 'PAID', paidAt: new Date() },
  });
  if (count === 0) return;

  // Étape 11 : envoi des courriels de confirmation ici
}

export function handlePaymentFailed(intent: Stripe.PaymentIntent): void {
  // Aucun changement en BD : la commande reste AWAITING_PAYMENT et le client peut réessayer
  console.warn('[payment] Paiement refusé', {
    orderId: intent.metadata.orderId,
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