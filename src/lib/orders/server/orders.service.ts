import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const userOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paidAt: true,
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
      delay: true,
      requestedDate: true,
      addresses: {
        select: {
          id: true,
          kind: true,

          streetNumber: true,
          streetName: true,
          apartment: true,
          postalCode: true,

          description: true,
          nearbyAddress: true,

          city: true,
          
          services: { select: { id: true, type: true, price: true, status: true, scheduledFor: true, completedAt: true, details: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export type UserOrder = Prisma.OrderGetPayload<{ select: typeof userOrderSelect }>;

/** Toutes les commandes du client (produits et services), les plus récentes en premier */
export function getUserOrders(userId: string): Promise<UserOrder[]> {
  return prisma.order.findMany({
    where: { userId },
    select: userOrderSelect,
    orderBy: { createdAt: 'desc' },
  });
}

const teamOrderSelect = {
  ...userOrderSelect,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.OrderSelect;

export type TeamOrder = Prisma.OrderGetPayload<{ select: typeof teamOrderSelect }>;
export type OrderOwner = NonNullable<TeamOrder['user']>;

type TeamMember = { id: string; joinedAt: Date | null };

/** Une condition par membre : seulement ses commandes passées depuis son entrée dans le groupe */
export function teamOrdersWhere(members: TeamMember[]): Prisma.OrderWhereInput {
  return {
    OR: members.flatMap(({ id, joinedAt }) =>
      joinedAt ? [{ userId: id, createdAt: { gte: joinedAt } }] : [],
    ),
  };
}

/** Commandes des membres du groupe (hors admin) depuis leur arrivée, les plus récentes en premier */
export async function getTeamOrders(groupId: string, adminId: string): Promise<TeamOrder[]> {
  const members = await prisma.user.findMany({
    where: { groupId, id: { not: adminId } },
    select: { id: true, joinedAt: true },
  });

  const where = teamOrdersWhere(members);
  if (!where.OR?.length) return [];

  return prisma.order.findMany({
    where,
    select: teamOrderSelect,
    orderBy: { createdAt: 'desc' },
  });
}