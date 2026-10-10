"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountType,
  isAccountType,
  type AccountType,
} from "@/features/superAdmin/constants/accountType";

export type ActionResult = { ok: true } | { ok: false; error: string };

class ActionError extends Error {}

async function requireSuperAdminAction() {
  const session = await auth();
  if (session?.user?.role !== "superAdmin") throw new ActionError("Non autorisé.");
  return session;
}

function toActionError(e: unknown): ActionResult {
  if (e instanceof ActionError) return { ok: false, error: e.message };
  throw e;
}

export async function deleteUserAction(
  userId: string,
  newAdminId?: string
): Promise<ActionResult> {
  try {
    const session = await requireSuperAdminAction();
    if (session.user.id === userId) {
      throw new ActionError("Vous ne pouvez pas supprimer votre propre compte.");
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, groupId: true },
      });
      if (!target) throw new ActionError("Utilisateur introuvable.");
      if (target.role === "superAdmin") throw new ActionError("Impossible de supprimer un superAdmin.");

      let emptyGroupId: string | null = null;

      if (target.role === "groupAdmin" && target.groupId) {
        const otherMembers = await tx.user.count({
          where: { groupId: target.groupId, id: { not: userId } },
        });

        if (otherMembers > 0) {
          if (!newAdminId) {
            throw new ActionError("Sélectionnez un nouvel administrateur pour ce groupe.");
          }
          // Le filtre valide en une requête que le successeur est bien membre de ce groupe
          const promoted = await tx.user.updateMany({
            where: { id: newAdminId, groupId: target.groupId, role: "user" },
            data: { role: "groupAdmin", groupStatus: "JOINED" },
          });
          if (promoted.count === 0) {
            throw new ActionError("Le nouvel administrateur doit être membre de ce groupe.");
          }
        } else {
          emptyGroupId = target.groupId;
        }
      }

      await tx.user.delete({ where: { id: userId } });
      if (emptyGroupId) await tx.group.delete({ where: { id: emptyGroupId } });
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Cet utilisateur a des données liées (commandes, etc.)." };
    }
    return toActionError(e);
  }
}

export async function updateAccountTypeAction(
  userId: string,
  accountType: AccountType
): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();
    // Une Server Action reçoit des données non fiables : on valide aussi à l'exécution
    if (!isAccountType(accountType)) throw new ActionError("Type de compte invalide.");

    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          groupStatus: true,
          group: { select: { id: true, _count: { select: { users: true } } } },
        },
      });

      if (!target) throw new ActionError("Utilisateur introuvable.");
      if (target.role === "superAdmin") throw new ActionError("Impossible de modifier un superAdmin.");
      if (getAccountType(target.role, target.groupStatus) === accountType) return;

      const ownedGroup = target.role === "groupAdmin" ? target.group : null;
      if (ownedGroup && ownedGroup._count.users > 1) {
        throw new ActionError("Ce groupe a encore des membres. Réassignez-les d'abord.");
      }

      if (accountType === "groupAdmin") {
        const group = await tx.group.create({ data: {}, select: { id: true } });
        await tx.user.update({
          where: { id: userId },
          data: { role: "groupAdmin", groupStatus: "JOINED", groupId: group.id },
        });
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            role: "user",
            groupStatus: accountType === "solo" ? "SOLO" : "PENDING",
            // undefined = champ inchangé pour Prisma
            groupId: accountType === "solo" || ownedGroup ? null : undefined,
          },
        });
      }

      // Supprimé après le détachement de l'utilisateur, à cause de la clé étrangère
      if (ownedGroup) await tx.group.delete({ where: { id: ownedGroup.id } });
    });

    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}