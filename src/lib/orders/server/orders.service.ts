import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrderAccess, withoutPrices } from '../billing';

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paidAt: true,
  billedToId: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  // Produits
  productsStatus: true,
  deliveryMode: true,
  deliveryStreet: true,
  deliveryCity: true,
  products: { select: { id: true, productName: true, quantity: true } },
  // Services
  serviceRequests: {
    select: {
      id: true,
      requestType: true,
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
          services: { select: { id: true, type: true, price: true, status: true, scheduledFor: true, completedAt: true } },
        },
      },
    },
  },
  // Paiement des services (présent seulement s'il a réussi)
  allocations: {
    where: { payment: { kind: 'SERVICES', status: 'SUCCEEDED' } },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

export type OrderOwner = NonNullable<OrderRow['user']>;

/** Commande telle que vue par un utilisateur donné : droits calculés côté serveur */
export type DashboardOrder = Omit<OrderRow, 'user' | 'billedToId' | 'allocations'> & {
  owner: OrderOwner | null;
  canSeePrices: boolean;
  canPay: boolean;
  servicesPaid: boolean;
};

function toDashboardOrder(row: OrderRow, viewerId: string): DashboardOrder {
  const { user, billedToId, allocations, ...order } = row;
  const { canSeePrices, canPay } = getOrderAccess({ ownerId: user?.id ?? null, billedToId }, viewerId);

  return {
    ...order,
    serviceRequests: canSeePrices ? order.serviceRequests : withoutPrices(order.serviceRequests),
    owner: user,
    canSeePrices,
    canPay,
    servicesPaid: allocations.length > 0,
  };
}

/** Commandes passées par l'utilisateur, les plus récentes en premier */
export async function getUserOrders(userId: string): Promise<DashboardOrder[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => toDashboardOrder(row, userId));
}

/**
 * Commandes d'autres personnes que l'utilisateur doit voir :
 * - membres JOINED de son groupe s'il en est l'admin (rôle relu en BD, pas depuis la session)
 * - toute commande qui lui est facturée, même si le membre a quitté le groupe
 *   ou si le groupe a été supprimé (sinon la facture devient introuvable)
 */
export async function getTeamOrders(viewerId: string): Promise<DashboardOrder[]> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true, groupId: true },
  });

  const scopes: Prisma.OrderWhereInput[] = [{ billedToId: viewerId }];
  if (viewer?.role === 'groupAdmin' && viewer.groupId) {
    scopes.push({ user: { groupId: viewer.groupId, groupStatus: 'JOINED' } });
  }

  const rows = await prisma.order.findMany({
    where: { userId: { not: viewerId }, OR: scopes },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => toDashboardOrder(row, viewerId));
}