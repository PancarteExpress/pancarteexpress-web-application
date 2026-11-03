"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { addMembersSchema, groupNameSchema, memberIdSchema, billingModeSchema, userSearchQuerySchema } from "../groups.schema";
import { getGroupDetails, type GroupDetails } from "./groups.service";

const userSearchSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

export type UserSearchResult = Prisma.UserGetPayload<{ select: typeof userSearchSelect }>;
// Erreurs métier traduites côté client (namespace i18n "groups", clé errors.<GroupErrorKey>)
export type GroupErrorKey = "nameTaken";
type GroupFailure = { ok: false; error: string } | { ok: false; errorKey: GroupErrorKey };
export type ActionResult = { ok: true } | { ok: false; error: string };

class GroupActionError extends Error {}
class ActionError extends Error {}

// Règle métier : un groupAdmin n'ajoute sans validation que les users en attente d'équipe (PENDING) et sans groupe
const addableMemberWhere = { groupId: null, groupStatus: "PENDING" } satisfies Prisma.UserWhereInput;
const MEMBER_UNAVAILABLE = "Un ou plusieurs coéquipiers ne sont plus disponibles";

export async function searchUsersByEmailAction(query: unknown): Promise<UserSearchResult[]> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "groupAdmin") return [];

  const parsed = userSearchQuerySchema.safeParse(query);
  if (!parsed.success) return [];

  return prisma.user.findMany({
    where: {
      email: { startsWith: parsed.data },
      ...addableMemberWhere,
      role: "user",
      id: { not: session.user.id },
    },
    select: userSearchSelect,
    orderBy: { email: "asc" },
    take: 5,
  });
}

export type GroupResult = { ok: true; group: GroupDetails } | { ok: false; error: string };
export type RenameGroupResult = { ok: true; group: GroupDetails } | GroupFailure;
type AdminContext = { ok: true; groupId: string } | { ok: false; error: string };

async function getAdminContext(): Promise<AdminContext> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Non authentifié" };

  // Rôle et groupe relus en BD, jamais depuis la session
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, groupId: true },
  });
  if (user?.role !== "groupAdmin") return { ok: false, error: "Action non autorisée" };
  if (!user.groupId) return { ok: false, error: "Aucune équipe associée" };

  return { ok: true, groupId: user.groupId };
}

export async function renameGroupAction(input: unknown): Promise<RenameGroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = groupNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  try {
    await prisma.group.update({ where: { id: ctx.groupId }, data: { name: parsed.data.name } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, errorKey: "nameTaken" };
    }
    throw e;
  }
  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}

export async function addGroupMembersAction(input: unknown): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = addMembersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const memberIds = [...new Set(parsed.data.memberIds)];

  try {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: { in: memberIds }, ...addableMemberWhere, role: "user" },
        data: { groupId: ctx.groupId, groupStatus: "JOINED", joinedAt: new Date() },
      });
      if (count !== memberIds.length) {
        throw new GroupActionError(MEMBER_UNAVAILABLE);
      }
    });
  } catch (e) {
    if (e instanceof GroupActionError) return { ok: false, error: e.message };
    throw e;
  }
  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}

export async function removeGroupMemberAction(memberId: string): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = memberIdSchema.safeParse(memberId);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide" };

  // role: "user" → impossible de retirer un admin (dont soi-même)
  const { count } = await prisma.user.updateMany({
    where: { id: parsed.data, groupId: ctx.groupId, role: "user" },
    data: { groupId: null, groupStatus: "SOLO", joinedAt: null },
  });
  if (count === 0) return { ok: false, error: "Ce membre ne peut pas être retiré" };

  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}

async function requireSuperAdminAction() {
  const session = await auth();
  if (session?.user?.role !== "superAdmin") throw new ActionError("Non autorisé.");
  return session;
}

export async function deleteGroupAction(groupId: string): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();

    await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });
      if (!group) throw new ActionError("Équipe introuvable.");

      // Tous les membres, groupAdmin compris, passent en forfait individuel
      await tx.user.updateMany({
        where: { groupId },
        data: { role: "user", groupStatus: "SOLO", groupId: null, joinedAt: null },
      });

      await tx.group.delete({ where: { id: groupId } });
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Cette équipe a des données liées (commandes, etc.)." };
    }
    throw e;
  }
}

export async function setBillingModeAction(mode: unknown): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = billingModeSchema.safeParse(mode);
  if (!parsed.success) return { ok: false, error: "Mode de facturation invalide" };

  // Le payeur est figé sur chaque commande : le changement ne vaut que pour les prochaines
  await prisma.group.update({
    where: { id: ctx.groupId },
    data: { billingMode: parsed.data },
  });

  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}