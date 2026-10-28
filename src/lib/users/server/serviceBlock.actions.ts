'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { addDays, isBilledToGroupAdmin, SERVICE_BLOCK_GRACE_DAYS } from '@/lib/orders/billing';
import { ActionError, requireSuperAdminAction, toActionError, type ActionResult } from '@/lib/auth/actionGuard';

const inputSchema = z.object({ userId: z.string().min(1).max(64), block: z.boolean() });

/** block: true → demandes refusées dans 3 jours ; false → débloqué immédiatement */
export async function setServiceBlockAction(userId: string, block: boolean): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();

    // Une Server Action reçoit des données non fiables
    const parsed = inputSchema.safeParse({ userId, block });
    if (!parsed.success) throw new ActionError('Données invalides.');

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        role: true,
        groupStatus: true,
        serviceBlockStartsAt: true,
        group: { select: { billingMode: true } },
      },
    });
    if (!target || target.role === 'superAdmin') throw new ActionError('Utilisateur introuvable.');

    if (parsed.data.block) {
      // Déjà bloqué (double clic, deux onglets) : on ne repousse pas l'échéance
      if (target.serviceBlockStartsAt) return { ok: true };

      // Ses factures vont à l'admin : c'est l'admin qu'il faut bloquer
      if (isBilledToGroupAdmin(target)) {
        throw new ActionError("Ce membre est facturé à son administrateur : bloquez l'administrateur du groupe.");
      }
    }

    // Le déblocage reste toujours permis (ex. membre bloqué avant un changement de mode)
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        serviceBlockStartsAt: parsed.data.block ? addDays(new Date(), SERVICE_BLOCK_GRACE_DAYS) : null,
      },
    });
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}