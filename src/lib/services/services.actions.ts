"use server";

import { prisma } from "@/lib/prisma";

import { priceInputSchema } from "@/features/superAdmin/schemas/price";
import { ActionError, ActionResult, requireSuperAdminAction, toActionError } from "../auth/actionGuard";

import {
  cancelPendingServicesPayment,
  ServicesPaymentError,
} from '@/lib/orders/server/servicesPayment.service';
import { Prisma } from "@prisma/client";

const servicesNotPaid = {
  serviceAddress: {
    serviceRequest: { order: { payments: { none: { kind: 'SERVICES', status: 'SUCCEEDED' } } } },
  },
} satisfies Prisma.ServiceWhereInput;

export async function updateServicePriceAction(
  serviceId: string,
  priceInput: string
): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();

    const parsed = priceInputSchema.safeParse(priceInput);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Montant invalide.");
    }

    const { count } = await prisma.service.updateMany({
      where: { id: serviceId, ...servicesNotPaid },
      data: { draftPrice: parsed.data },
    });

    if (count === 0) {
      const exists = await prisma.service.count({ where: { id: serviceId } });
      throw new ActionError(exists ? "Services déjà payés : le prix ne peut plus être modifié." : "Service introuvable.");
    }

    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export type PublishPricesResult =
  | { ok: true; published: number; skipped: number; failed: number }
  | { ok: false; error: string };

export async function publishPricesAction(): Promise<PublishPricesResult> {
  try {
    await requireSuperAdminAction();

    // Commandes non annulées, services non payés, avec au moins un brouillon différent du prix envoyé
    const orders = await prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        payments: { none: { kind: "SERVICES", status: "SUCCEEDED" } },
        serviceRequests: { some: { addresses: { some: { services: { some: { status: { not: "CANCELLED" } } } } } } },
      },
      select: {
        id: true,
        serviceRequests: {
          select: {
            addresses: {
              select: { services: { select: { id: true, status: true, price: true, draftPrice: true } } },
            },
          },
        },
      },
    });

    let published = 0;
    let skipped = 0;
    let failed = 0;

    for (const order of orders) {
      const services = order.serviceRequests
        .flatMap((r) => r.addresses.flatMap((a) => a.services))
        .filter((s) => s.status !== "CANCELLED");

      const hasChanges = services.some((s) => s.draftPrice !== s.price);
      if (!hasChanges) continue;

      // Facture incomplète : on n'envoie pas une soumission partielle
      if (services.some((s) => s.draftPrice === null)) {
        skipped++;
        continue;
      }

      try {
        // L'ancien montant n'est plus valide : le client devra relancer le paiement
        await cancelPendingServicesPayment(order.id);

        await prisma.$transaction(
          services
            .filter((s) => s.draftPrice !== s.price)
            .map((s) =>
              prisma.service.updateMany({
                where: { id: s.id, ...servicesNotPaid },
                data: { price: s.draftPrice },
              })
            )
        );
        published++;
      } catch (e) {
        // Ex. : le client est en train de payer. On continue avec les autres commandes.
        if (!(e instanceof ServicesPaymentError)) console.error("[publish-prices]", order.id, e);
        failed++;
      }
    }

    return { ok: true, published, skipped, failed };
  } catch (e) {
    const result = toActionError(e);
    return result.ok ? { ok: false, error: "Erreur inattendue." } : result;
  }
}