import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { OrderLookupInput } from '@/lib/orders/orderLookup.schema';

/*
 * Ne sélectionne que ce qu'affiche le résumé : ni téléphone, ni prix, ni paiement.
 * Les codes de boîtes à clés restent visibles (choix du propriétaire du site).
 */
const lookupSelect = {
  id: true,
  addressNumber: true,
  kind: true,
  streetNumber: true,
  streetName: true,
  apartment: true,
  description: true,
  nearbyAddress: true,
  city: true,
  delay: true,
  requestedDate: true,
  services: { select: { id: true, type: true, details: true } },
  serviceRequest: {
    select: { requestType: true, order: { select: { userId: true } } },
  },
} satisfies Prisma.ServiceAddressSelect;

type AddressRow = Prisma.ServiceAddressGetPayload<{ select: typeof lookupSelect }>;
type RequestRow = AddressRow['serviceRequest'];

/** Une adresse et le contexte de sa demande ; date en 'yyyy-MM-dd' (sérialisable sans ambiguïté de fuseau) */
export type LookupAddress = Omit<AddressRow, 'serviceRequest' | 'requestedDate'> &
  Pick<RequestRow, 'requestType'> & { requestedDate: string | null };

export type OrderLookupResult =
  | { status: 'notFound' }
  /** Commande liée à un compte : on renvoie vers le tableau de bord, sans rien afficher */
  | { status: 'member' }
  | { status: 'found'; address: LookupAddress };

export async function lookupOrder({ addressNumber, email }: OrderLookupInput): Promise<OrderLookupResult> {
  const row = await prisma.serviceAddress.findFirst({
    where: {
      addressNumber,
      serviceRequest: { order: { email: { equals: email, mode: 'insensitive' } } },
    },
    select: lookupSelect,
  });

  // Même réponse si le numéro n'existe pas ou si le courriel ne correspond pas (anti-énumération)
  if (!row) return { status: 'notFound' };

  const { serviceRequest: request, ...address } = row;
  if (request.order.userId) return { status: 'member' };

  return {
    status: 'found',
    address: {
      ...address,
      requestType: request.requestType,
      // @db.Date stockée à minuit UTC : la partie date ISO est le bon jour
      requestedDate: address.requestedDate ? address.requestedDate.toISOString().slice(0, 10) : null,
    },
  };
}