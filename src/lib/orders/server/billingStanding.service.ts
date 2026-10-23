import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  addDays,
  computeBillingStanding,
  getStandingScopes,
  PAYMENT_DUE_DAYS,
  PAYMENT_WARNING_DAYS,
  type BillingStanding,
} from '../billing';

/** Facture envoyée et encore due : non annulée, au moins un service actif, non payée, avec un payeur */
export const openInvoiceWhere = {
  status: { not: 'CANCELLED' },
  billedToId: { not: null },
  allocations: { none: { payment: { kind: 'SERVICES', status: 'SUCCEEDED' } } },
  serviceRequests: { some: { addresses: { some: { services: { some: { status: { not: 'CANCELLED' } } } } } } },
} satisfies Prisma.OrderWhereInput;

export async function getBillingStanding(userId: string, now: Date = new Date()): Promise<BillingStanding> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      groupId: true,
      groupStatus: true,
      group: {
        select: {
          billingMode: true,
          users: { where: { role: 'groupAdmin' }, select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!user) return { status: 'ok' };

  const orders = await prisma.order.findMany({
    where: {
      ...openInvoiceWhere,
      OR: getStandingScopes({
        ...user,
        group: user.group && { billingMode: user.group.billingMode, adminId: user.group.users[0]?.id ?? null },
      }),
      // Seules comptent les factures à 7 jours ou moins de leur échéance (ou déjà échues)
      invoicedAt: { lte: addDays(now, PAYMENT_WARNING_DAYS - PAYMENT_DUE_DAYS) },
    },
    select: { invoicedAt: true, billedTo: { select: { billingUnblockedUntil: true } } },
  });

  return computeBillingStanding(
    orders.flatMap((o) =>
      o.invoicedAt
        ? [{ invoicedAt: o.invoicedAt, payerUnblockedUntil: o.billedTo?.billingUnblockedUntil ?? null }]
        : [],
    ),
    now,
  );
}