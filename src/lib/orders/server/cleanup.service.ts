import 'server-only';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';

const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000; // 24 h
const BATCH_SIZE = 50; // limite par exécution, pour rester sous le temps maximal d'une fonction Vercel

export interface CleanupResult {
  deleted: number;
  skipped: number;
  failed: number;
}

export async function cleanupAbandonedOrders(now: Date = new Date()): Promise<CleanupResult> {
  const cutoff = new Date(now.getTime() - ABANDONED_AFTER_MS);

  const orders = await prisma.order.findMany({
    where: { status: 'AWAITING_PAYMENT', createdAt: { lt: cutoff } },
    select: {
      id: true,
      orderNumber: true,
      // Une commande AWAITING_PAYMENT n'a qu'un paiement PRODUCTS (créé au checkout)
      allocations: {
        where: { payment: { kind: 'PRODUCTS' } },
        select: { payment: { select: { paymentIntentId: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  const result: CleanupResult = { deleted: 0, skipped: 0, failed: 0 };

    for (const order of orders) {
    const intentIds = order.allocations.map((a) => a.payment.paymentIntentId);

    try {
      let paid = false;
      for (const intentId of intentIds) {
        const intent = await stripe.paymentIntents.retrieve(intentId);

        // Le client a payé (ou le paiement est en cours) : le webhook n'est pas encore passé.
        // Supprimer ici ferait perdre une commande payée.
        if (intent.status === 'succeeded' || intent.status === 'processing') {
          console.warn('[cleanup] Paiement reçu mais commande non confirmée', {
            orderNumber: order.orderNumber,
            paymentIntentId: intent.id,
          });
          paid = true;
          break;
        }

        // Empêche un client revenant sur un vieil onglet de payer une commande supprimée
        if (intent.status !== 'canceled') {
          await stripe.paymentIntents.cancel(intentId, { cancellation_reason: 'abandoned' });
        }
      }

      if (paid) {
        result.skipped++;
        continue;
      }

      const deleted = await prisma.$transaction(async (tx) => {
        // Conditionnel : si le webhook l'a passée à PAID entre-temps, elle n'est pas supprimée
        const { count } = await tx.order.deleteMany({
          where: { id: order.id, status: 'AWAITING_PAYMENT' },
        });
        // Le Payment n'est plus supprimé par cascade depuis la commande (seule l'allocation l'est)
        if (count > 0 && intentIds.length > 0) {
          await tx.payment.deleteMany({ where: { paymentIntentId: { in: intentIds }, kind: 'PRODUCTS' } });
        }
        return count;
      });
      result.deleted += deleted;
    } catch (error) {
      // Une erreur sur une commande ne bloque pas les autres ; elle sera retentée demain
      console.error('[cleanup] Échec pour la commande', order.orderNumber, error);
      result.failed++;
    }
  }

  return result;
}