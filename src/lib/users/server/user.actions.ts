"use server";

import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActionError, requireSuperAdminAction, toActionError, type ActionResult } from "@/lib/auth/actionGuard";
import {
  getAccountType,
  isAccountType,
  type AccountType,
} from "@/lib/users/accountType";
import { sendAccountDeletedEmail } from "@/lib/users/server/accountDeleted.email";
import { notifyAccountTypeChanges, type AccountTypeChange } from "@/lib/users/server/accountType.emails";

export async function deleteUserAction(
  userId: string,
  newAdminId?: string
): Promise<ActionResult> {
  try {
    const session = await requireSuperAdminAction();
    if (session.user.id === userId) {
      throw new ActionError("Vous ne pouvez pas supprimer votre propre compte.");
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, groupId: true, email: true, firstName: true, locale: true, group: { select: { name: true } } },
      });
      if (!target) throw new ActionError("Utilisateur introuvable.");
      if (target.role === "superAdmin") throw new ActionError("Impossible de supprimer un superAdmin.");

      let emptyGroupId: string | null = null;
      let promotedAdmin: AccountTypeChange | null = null;

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
          const successor = await tx.user.findUnique({
            where: { id: newAdminId },
            select: { email: true, firstName: true, locale: true }
          });
          if (successor) promotedAdmin = { ...successor, to: "groupAdmin", groupName: target.group?.name ?? null };
        } else {
          emptyGroupId = target.groupId;
        }
      }

      await tx.user.delete({ where: { id: userId } });
      if (emptyGroupId) await tx.group.delete({ where: { id: emptyGroupId } });
      return { email: target.email, firstName: target.firstName, locale: target.locale, promotedAdmin };
    });

    // Seulement une fois la suppression validée ; après la réponse, un échec est journalisé
    after(async () => {
      try {
        await sendAccountDeletedEmail(deleted.email, deleted.firstName, deleted.locale);
      } catch (err) {
        console.error("[delete-user] Échec du courriel d'au revoir :", userId, err);
      }
      // Le membre promu à la place de l'admin supprimé
      if (deleted.promotedAdmin) await notifyAccountTypeChanges([deleted.promotedAdmin]);
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

    const change = await prisma.$transaction(async (tx): Promise<AccountTypeChange | null> => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          locale: true,
          role: true,
          groupStatus: true,
          group: { select: { id: true, name: true, _count: { select: { users: true } } } },
        },
      });

      if (!target) throw new ActionError("Utilisateur introuvable.");
      if (target.role === "superAdmin") throw new ActionError("Impossible de modifier un superAdmin.");
      if (getAccountType(target.role, target.groupStatus) === accountType) return null;

      const ownedGroup = target.role === "groupAdmin" ? target.group : null;
      if (ownedGroup && ownedGroup._count.users > 1) {
        throw new ActionError("Ce groupe a encore des membres. Réassignez-les d'abord.");
      }

      if (accountType === "groupAdmin") {
        const group = await tx.group.create({ data: {}, select: { id: true } });
        await tx.user.update({
          where: { id: userId },
          data: { role: "groupAdmin", groupStatus: "JOINED", groupId: group.id, joinedAt: new Date() },
        });
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            role: "user",
            groupStatus: accountType === "solo" ? "SOLO" : "PENDING",
            // Solo comme En attente : hors de toute équipe. Un membre passé En attente doit
            // pouvoir être ajouté de nouveau, et la recherche d'un admin exige groupId: null
            groupId: null,
            joinedAt: null,
          },
        });
      }

      // Supprimé après le détachement de l'utilisateur, à cause de la clé étrangère
      if (ownedGroup) await tx.group.delete({ where: { id: ownedGroup.id } });

      const { email, firstName, locale } = target;
      if (accountType === "groupAdmin") return { email, firstName, locale, to: "groupAdmin", groupName: null };
      // Équipe quittée : seulement s'il en faisait vraiment partie
      const leftGroupName = target.groupStatus === "JOINED" ? (target.group?.name ?? null) : undefined;
      return { email, firstName, locale, to: accountType, groupName: leftGroupName, groupDeleted: ownedGroup !== null };
    });

    if (change) after(() => notifyAccountTypeChanges([change]));
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}