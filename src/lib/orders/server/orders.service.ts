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
          
          services: { select: { id: true, type: true, status: true, scheduledFor: true, completedAt: true } },
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