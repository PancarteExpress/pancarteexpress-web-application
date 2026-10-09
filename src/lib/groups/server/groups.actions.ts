"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { addMembersSchema, createGroupSchema, groupNameSchema, memberIdSchema } from "../groups.schema";
import { getGroupDetails, type GroupDetails } from "./groups.service";

const userSearchSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

export type UserSearchResult = Prisma.UserGetPayload<{ select: typeof userSearchSelect }>;
export type CreateGroupResult = { ok: true } | { ok: false; error: string };
class GroupActionError extends Error {}


export async function searchUsersByEmailAction(query: string): Promise<UserSearchResult[]> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "groupAdmin") return [];

  const q = query.trim().toLowerCase();
  if (q.length < 3 || q.length > 254) return [];

  return prisma.user.findMany({
    where: {
      email: { startsWith: q },
      groupId: null,              // seulement les users sans équipe
      role: "user",
      id: { not: session.user.id },
    },
    select: userSearchSelect,
    orderBy: { email: "asc" },
    take: 5,
  });
}

export async function createGroupAction(input: unknown): Promise<CreateGroupResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Non authentifié" };
  if (session.user.role !== "groupAdmin") return { ok: false, error: "Action non autorisée" };

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { name } = parsed.data;
  const memberIds = [...new Set(parsed.data.memberIds)].filter((id) => id !== userId);

  try {
    await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: { name } });

      // Condition groupId: null dans le WHERE → protège contre double-submit / course
      const admin = await tx.user.updateMany({
        where: { id: userId, groupId: null },
        data: { groupId: group.id, groupStatus: "JOINED" },
      });
      if (admin.count !== 1) throw new GroupActionError("Vous êtes déjà lié à une équipe");

      if (memberIds.length > 0) {
        const members = await tx.user.updateMany({
          where: { id: { in: memberIds }, groupId: null, role: "user" },
          data: { groupId: group.id, groupStatus: "JOINED" },
        });
        if (members.count !== memberIds.length) {
          throw new GroupActionError("Un ou plusieurs coéquipiers ont rejoint une autre équipe entre-temps");
        }
      }
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof GroupActionError) return { ok: false, error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ce nom d'équipe est déjà utilisé" };
    }
    throw e;
  }
}


export type GroupResult = { ok: true; group: GroupDetails } | { ok: false; error: string };
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

export async function renameGroupAction(input: unknown): Promise<GroupResult> {
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
      return { ok: false, error: "Ce nom d'équipe est déjà utilisé" };
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
        where: { id: { in: memberIds }, groupId: null, role: "user" },
        data: { groupId: ctx.groupId, groupStatus: "JOINED" },
      });
      if (count !== memberIds.length) {
        throw new GroupActionError("Un ou plusieurs coéquipiers ont rejoint une autre équipe entre-temps");
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
    data: { groupId: null, groupStatus: "SOLO" },
  });
  if (count === 0) return { ok: false, error: "Ce membre ne peut pas être retiré" };

  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}