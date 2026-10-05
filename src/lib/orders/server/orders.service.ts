import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const productOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  productsStatus: true,
  paidAt: true,
  deliveryMode: true,
  deliveryStreet: true,
  deliveryCity: true,
  products: { select: { id: true, productName: true, quantity: true } },
} satisfies Prisma.OrderSelect;

const serviceOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  serviceRequests: {
    select: {
      id: true,
      requestType: true,
      addresses: {
        select: {
          id: true,
          kind: true,
          // Adresse civique
          streetNumber: true,
          streetName: true,
          apartment: true,
          // Terrain
          description: true,
          nearbyAddress: true,
          // Commun
          city: true,
          services: { select: { id: true, type: true, status: true, scheduledFor: true, completedAt: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export type UserProductOrder = Prisma.OrderGetPayload<{ select: typeof productOrderSelect }>;
export type UserServiceOrder = Prisma.OrderGetPayload<{ select: typeof serviceOrderSelect }>;

/** Commandes du client qui contiennent au moins un produit, les plus récentes en premier */
export function getUserProductOrders(userId: string): Promise<UserProductOrder[]> {
  return prisma.order.findMany({
    where: { userId, products: { some: {} } },
    select: productOrderSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export function getUserServiceOrders(userId: string): Promise<UserServiceOrder[]> {
  return prisma.order.findMany({
    where: { userId, serviceRequests: { some: {} } },
    select: serviceOrderSelect,
    orderBy: { createdAt: 'desc' },
  });
}