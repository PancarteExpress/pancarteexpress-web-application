import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { collectServiceBlocks, computeServiceAccess, type ServiceAccess } from '@/lib/orders/billing';

const blockableSelect = {
  id: true,
  role: true,
  groupStatus: true,
  serviceBlockStartsAt: true,
} satisfies Prisma.UserSelect;

/** Accès aux demandes de service : rôle, groupe et mode toujours relus en BD, jamais depuis la session */
export async function getServiceAccess(userId: string, now: Date = new Date()): Promise<ServiceAccess> {
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...blockableSelect,
      group: { select: { billingMode: true, users: { select: blockableSelect } } },
    },
  });
  if (!viewer) return { status: 'ok' };
  return computeServiceAccess(collectServiceBlocks(viewer), now);
}