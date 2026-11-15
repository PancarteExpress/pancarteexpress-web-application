
import 'server-only';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { IsoDate } from '../calendar';
import { openHouseRemovalDate } from '../openHouse';
import { buildOpenHouseRemovalPayload, buildOptimoPayload } from '../payload';
import { sendOptimoOrder } from './client';
import { formatAddressNumber } from '@/lib/services/addressNumber';
 
const MAX_ERROR_LENGTH = 500;
const RETRY_BATCH = 50;
const SENDABLE_STATUSES: OrderStatus[] = ['PENDING', 'PAID'];
 
/**
 * Une adresse de service = un arrêt OptimoRoute (tous les services de l'adresse dans la même tâche),
 * plus une tâche de retrait par visite libre dont le retrait est demandé.
 * orderNo = "PE-<addressNumber>" (retrait : "PE-<addressNumber>-R") : unique et stable,
 * donc SYNC rend les réessais idempotents.
 * Le préfixe évite toute collision avec les numéros de l'ancien site (50 000+).
 */
async function syncAddresses(addressIds?: string[], orderId?: string): Promise<void> {
  const orders = await prisma.order.findMany({
    where: {
      // Jamais avant la confirmation : une commande AWAITING_PAYMENT peut être supprimée par le cron
      status: { in: SENDABLE_STATUSES },
      ...(orderId
        ? { id: orderId }
        : { serviceRequests: { some: { addresses: { some: { id: { in: addressIds } } } } } }),
    },
    select: {
      createdAt: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      serviceRequests: {
        // Le grand format n'est pas envoyé à OptimoRoute : seulement par courriel à l'équipe
        where: { requestType: 'residential' },
        orderBy: { id: 'asc' },
        select: {
          addresses: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              addressNumber: true,
              kind: true,
              streetNumber: true,
              streetName: true,
              apartment: true,
              postalCode: true,
              description: true,
              nearbyAddress: true,
              city: true,
              delay: true,
              requestedDate: true,
              optimoSyncStatus: true,
              services: { where: { status: { not: 'CANCELLED' } }, select: { type: true, details: true } },
            },
          },
        },
      },
    },
  });
 
  const jobs = orders.flatMap((order) => {
    return order.serviceRequests
      .flatMap((req) => req.addresses.map((address) => ({ address, orderNo: formatAddressNumber(address.addressNumber) })))
      .filter(({ address }) => address.services.length > 0 && address.optimoSyncStatus !== 'SYNCED')
      .filter(({ address }) => !addressIds || addressIds.includes(address.id))
      .map(async ({ address, orderNo }) => {
        const mainPayload = buildOptimoPayload({
          orderNo,
          orderCreatedAt: order.createdAt,
          // Seules les adresses résidentielles arrivent ici, et elles ont toujours un délai ;
          // le repli ne sert qu'aux très anciennes demandes enregistrées sans délai
          delay: address.delay ?? 'standard24h',
          requestedDate: address.requestedDate,
          address,
          serviceTypes: address.services.map((s) => s.type),
          customer: order,
        });
 
        // Une tâche de retrait par date distincte (en pratique : une seule installation par adresse)
        const removalDates = [
          ...new Set(
            address.services
              .filter((s) => s.type === 'installation')
              .map((s) => openHouseRemovalDate(s.details))
              .filter((date): date is IsoDate => date !== null),
          ),
        ];
        const removalPayloads = removalDates.map((date, i) =>
          buildOpenHouseRemovalPayload({
            orderNo: `${orderNo}-R${i === 0 ? '' : i + 1}`,
            date,
            address,
            customer: order,
          }),
        );
 
        const [main, ...removals] = await Promise.all([mainPayload, ...removalPayloads].map(sendOptimoOrder));
        const errors = [main, ...removals].flatMap((r) => (r.ok ? [] : [r.error]));
 
        // SYNCED seulement si toutes les tâches sont parties ; sinon le cron renvoie tout (SYNC = sans doublon)
        await prisma.serviceAddress.update({
          where: { id: address.id },
          data:
            errors.length === 0
              ? {
                  optimoSyncStatus: 'SYNCED',
                  optimoRouteId: main.ok ? main.id : null,
                  optimoSyncError: null,
                  optimoSyncedAt: new Date(),
                }
              : { optimoSyncStatus: 'FAILED', optimoSyncError: errors.join(' | ').slice(0, MAX_ERROR_LENGTH) },
        });
 
        if (errors.length > 0) console.error(`[optimoroute] ${orderNo} : ${errors.join(' | ')}`);
      });
  });
 
  await Promise.allSettled(jobs);
}
 
/** À appeler dans after() une fois la commande créée au checkout. Ne lève jamais. */
export async function syncOrderToOptimoRoute(orderId: string): Promise<void> {
  try {
    await syncAddresses(undefined, orderId);
  } catch (err) {
    console.error('[optimoroute] sync commande', orderId, err);
  }
}
 
/** Pour le cron : renvoie les adresses en échec ou jamais envoyées (after() interrompu). */
export async function retryFailedOptimoSyncs(): Promise<number> {
  const pending = await prisma.serviceAddress.findMany({
    where: {
      optimoSyncStatus: { in: ['PENDING', 'FAILED'] },
      // Laisse le temps à after() de finir avant de réessayer
      serviceRequest: { order: { createdAt: { lt: new Date(Date.now() - 10 * 60_000) }, status: { in: SENDABLE_STATUSES } } },
    },
    select: { id: true },
    take: RETRY_BATCH,
  });
 
  if (pending.length > 0) await syncAddresses(pending.map((a) => a.id));
  return pending.length;
}
 