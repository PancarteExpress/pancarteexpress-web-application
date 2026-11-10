import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { OrderLookupInput } from '@/lib/orders/orderLookup.schema';

/*
 * Ne sélectionne que ce qu'affiche le résumé : ni téléphone, ni prix, ni paiement.
 * Les codes de boîtes à clés restent visibles (choix du propriétaire du site).
 */
const lookupSelect = {
  orderNumber: true,
  user: { select: { id: true } },
  serviceRequests: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      requestType: true,
      delay: true,
      requestedDate: true,
      addresses: {
        select: {
          id: true,
          kind: true,
          streetNumber: true,
          streetName: true,
          apartment: true,
          description: true,
          nearbyAddress: true,
          city: true,
          services: { select: { id: true, type: true, details: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type RequestRow = Prisma.OrderGetPayload<{ select: typeof lookupSelect }>['serviceRequests'][number];

/** Date en 'yyyy-MM-dd' : sérialisable en JSON sans ambiguïté de fuseau */
export type LookupServiceRequest = Omit<RequestRow, 'requestedDate'> & { requestedDate: string | null };

export interface LookupOrder {
  orderNumber: number;
  serviceRequests: LookupServiceRequest[];
}

export type OrderLookupResult =
  | { status: 'notFound' }
  /** Commande liée à un compte : on renvoie vers le tableau de bord, sans rien afficher */
  | { status: 'member' }
  | { status: 'found'; order: LookupOrder };

export async function lookupOrder({ orderNumber, email }: OrderLookupInput): Promise<OrderLookupResult> {
  const order = await prisma.order.findFirst({
    where: { orderNumber, email: { equals: email, mode: 'insensitive' } },
    select: lookupSelect,
  });

  // Même réponse si le numéro n'existe pas ou si le courriel ne correspond pas (anti-énumération)
  if (!order) return { status: 'notFound' };
  if (order.user) return { status: 'member' };

  return {
    status: 'found',
    order: {
      orderNumber: order.orderNumber,
      serviceRequests: order.serviceRequests.map((r) => ({
        ...r,
        // @db.Date stockée à minuit UTC : la partie date ISO est le bon jour
        requestedDate: r.requestedDate ? r.requestedDate.toISOString().slice(0, 10) : null,
      })),
    },
  };
}
