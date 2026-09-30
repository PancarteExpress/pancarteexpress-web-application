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
    select: { id: true, orderNumber: true, paymentIntentId: true },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  const result: CleanupResult = { deleted: 0, skipped: 0, failed: 0 };

  for (const order of orders) {
    try {
      if (order.paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

        // Le client a payé (ou le paiement est en cours) : le webhook n'est pas encore passé.
        // Supprimer ici ferait perdre une commande payée.
        if (intent.status === 'succeeded' || intent.status === 'processing') {
          console.warn('[cleanup] Paiement reçu mais commande non confirmée', {
            orderNumber: order.orderNumber,
            paymentIntentId: intent.id,
          });
          result.skipped++;
          continue;
        }

        // Empêche un client revenant sur un vieil onglet de payer une commande supprimée
        if (intent.status !== 'canceled') {
          await stripe.paymentIntents.cancel(order.paymentIntentId, { cancellation_reason: 'abandoned' });
        }
      }

      // Conditionnel : si le webhook l'a passée à PAID entre-temps, elle n'est pas supprimée
      const { count } = await prisma.order.deleteMany({
        where: { id: order.id, status: 'AWAITING_PAYMENT' },
      });
      result.deleted += count;
    } catch (error) {
      // Une erreur sur une commande ne bloque pas les autres ; elle sera retentée demain
      console.error('[cleanup] Échec pour la commande', order.orderNumber, error);
      result.failed++;
    }
  }

  return result;
}