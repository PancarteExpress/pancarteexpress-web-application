"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { CONFIRMED_ORDER_WHERE } from "@/lib/orders/constants";
import { ActionError, requireSuperAdminAction, toActionError, type ActionResult } from "@/lib/auth/actionGuard";
import { SERVICE_STATUSES } from "@/lib/services/serviceStatus";

const inputSchema = z.object({
  serviceId: z.string().min(1).max(64),
  status: z.enum(SERVICE_STATUSES),
});

/** SuperAdmin : change le statut d'un service. « Terminé » fixe la date de fin ; les autres l'effacent. */
export async function updateServiceStatusAction(serviceId: string, status: string): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();

    // Une Server Action reçoit des données non fiables
    const parsed = inputSchema.safeParse({ serviceId, status });
    if (!parsed.success) throw new ActionError("Données invalides.");

    const { count } = await prisma.service.updateMany({
      // Seulement les services d'une commande confirmée (jamais ceux d'un paiement abandonné)
      where: {
        id: parsed.data.serviceId,
        serviceAddress: { serviceRequest: { order: CONFIRMED_ORDER_WHERE } },
      },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
      },
    });
    if (count === 0) throw new ActionError("Service introuvable.");

    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}