"use server";

import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { ActionError, requireSuperAdminAction, toActionError, type ActionResult } from "@/lib/auth/actionGuard";
import { addMembersSchema, groupNameSchema, memberIdSchema, billingModeSchema, userSearchQuerySchema } from "../groups.schema";
import { getGroupDetails, type GroupDetails } from "./groups.service";
import { notifyAccountTypeChanges } from "@/lib/users/server/accountType.emails";

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

class GroupActionError extends Error {}

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

  // En attente → membre : chaque nouveau coéquipier est prévenu, après la réponse
  const groupId = ctx.groupId;
  after(async () => {
    const [members, group] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: memberIds } }, select: { email: true, firstName: true, locale: true } }),
      prisma.group.findUnique({ where: { id: groupId }, select: { name: true, billingMode: true } }),
    ]);
    await notifyAccountTypeChanges(
      members.map((m) => ({ ...m, to: "member", groupName: group?.name ?? null, billingMode: group?.billingMode })),
    );
  });
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

  // Membre → solo : prévenu après la réponse
  const groupId = ctx.groupId;
  after(async () => {
    const [member, group] = await Promise.all([
      prisma.user.findUnique({ where: { id: parsed.data }, select: { email: true, firstName: true, locale: true } }),
      prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
    ]);
    if (member) await notifyAccountTypeChanges([{ ...member, to: "solo", groupName: group?.name ?? null }]);
  });
  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}

export async function deleteGroupAction(groupId: string): Promise<ActionResult> {
  try {
    await requireSuperAdminAction();

    const removed = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true },
      });
      if (!group) throw new ActionError("Équipe introuvable.");

      // Lus avant le détachement : l'équipe n'existera plus pour les retrouver
      const members = await tx.user.findMany({ where: { groupId }, select: { email: true, firstName: true, locale: true } });

      // Tous les membres, groupAdmin compris, passent en forfait individuel
      await tx.user.updateMany({
        where: { groupId },
        data: { role: "user", groupStatus: "SOLO", groupId: null, joinedAt: null },
      });

      await tx.group.delete({ where: { id: groupId } });
      return { groupName: group.name, members };
    });

    // Tous passent en forfait individuel : prévenus après la réponse
    after(() =>
      notifyAccountTypeChanges(
        removed.members.map((m) => ({ ...m, to: "solo", groupName: removed.groupName, groupDeleted: true })),
      ),
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Cette équipe a des données liées (commandes, etc.)." };
    }
    return toActionError(e);
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