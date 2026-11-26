"use server";

import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { ActionError, requireSuperAdminAction, toActionError, type ActionResult } from "@/lib/auth/actionGuard";
import { addMembersSchema, groupNameSchema, memberIdSchema, billingModeSchema, userSearchQuerySchema, invitationResponseSchema } from "../groups.schema";
import { getGroupDetails, type GroupDetails } from "./groups.service";
import { sendGroupInvitationEmails, sendInvitationResponseEmail } from "./groupInvitation.emails";
import { notifyAccountTypeChanges } from "@/lib/users/server/accountType.emails";
import { isRateLimited, LIMITS } from "@/lib/rateLimit/server/rateLimit";

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
const MEMBER_UNAVAILABLE = "memberUnavailable";
const INVITATION_UNAVAILABLE = "invitationUnavailable";
const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

// Invitation encore valable : en attente et non expirée
const activeInvitationWhere = (now: Date): Prisma.GroupInvitationWhereInput => ({
  status: "PENDING",
  expiresAt: { gt: now },
});

export type InvitationResult = { ok: true } | { ok: false; error: string };

export type MemberSearchError = "invalidEmail" | "tooManyAttempts";
export type MemberSearchResult = { ok: true; users: UserSearchResult[] } | { ok: false; error: MemberSearchError };

// Courriel complet et exact seulement : un groupAdmin ne peut pas parcourir les comptes en attente
export async function searchUsersByEmailAction(query: unknown): Promise<MemberSearchResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "groupAdmin") return { ok: true, users: [] };

  const parsed = userSearchQuerySchema.safeParse(query);
  if (!parsed.success) return { ok: false, error: "invalidEmail" };

  // Empêche de tester des courriels en boucle pour savoir lesquels ont un compte
  const limited = await isRateLimited("memberSearch", [
    { key: `user:${session.user.id}`, limit: LIMITS.memberSearchUser },
  ]);
  if (limited) return { ok: false, error: "tooManyAttempts" };

  const users = await prisma.user.findMany({
    where: {
      email: { equals: parsed.data, mode: "insensitive" },
      ...addableMemberWhere,
      role: "user",
      id: { not: session.user.id },
    },
    select: userSearchSelect,
    take: 1,
  });
  return { ok: true, users };
}

export type GroupResult = { ok: true; group: GroupDetails } | { ok: false; error: string };
export type RenameGroupResult = { ok: true; group: GroupDetails } | GroupFailure;
type AdminContext = { ok: true; groupId: string } | { ok: false; error: string };

async function getAdminContext(): Promise<AdminContext> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauthenticated" };

  // Rôle et groupe relus en BD, jamais depuis la session
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, groupId: true },
  });
  if (user?.role !== "groupAdmin") return { ok: false, error: "notAllowed" };
  if (!user.groupId) return { ok: false, error: "noGroup" };

  return { ok: true, groupId: user.groupId };
}

export async function renameGroupAction(input: unknown): Promise<RenameGroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = groupNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalidData" };
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

// Le groupAdmin invite ; le compte ne rejoint l'équipe qu'en acceptant depuis son dashboard
export async function inviteGroupMembersAction(input: unknown): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = addMembersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalidData" };
  }
  const memberIds = [...new Set(parsed.data.memberIds)];
  const groupId = ctx.groupId;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

  let newlyInvited: string[];
  try {
    newlyInvited = await prisma.$transaction(async (tx) => {
      const available = await tx.user.count({
        where: { id: { in: memberIds }, ...addableMemberWhere, role: "user" },
      });
      if (available !== memberIds.length) throw new GroupActionError(MEMBER_UNAVAILABLE);

      // Déjà invités (invitation encore valable) : ni nouvelle invitation ni second courriel
      const active = await tx.groupInvitation.findMany({
        where: { groupId, userId: { in: memberIds }, ...activeInvitationWhere(now) },
        select: { userId: true },
      });
      const activeIds = new Set(active.map((i) => i.userId));
      const toInvite = memberIds.filter((id) => !activeIds.has(id));

      // Réinviter après un refus, une annulation ou une expiration relance l'invitation pour 14 jours
      for (const userId of toInvite) {
        await tx.groupInvitation.upsert({
          where: { groupId_userId: { groupId, userId } },
          create: { groupId, userId, expiresAt },
          update: { status: "PENDING", expiresAt, respondedAt: null },
        });
      }
      return toInvite;
    });
  } catch (e) {
    if (e instanceof GroupActionError) return { ok: false, error: e.message };
    throw e;
  }

  if (newlyInvited.length > 0) {
    after(async () => {
      const [invitees, group] = await Promise.all([
        prisma.user.findMany({ where: { id: { in: newlyInvited } }, select: { email: true, firstName: true, locale: true } }),
        prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
      ]);
      await sendGroupInvitationEmails(invitees, group?.name ?? null);
    });
  }
  return { ok: true, group: await getGroupDetails(groupId) };
}

// Le membre accepte ou refuse depuis son dashboard
export async function respondToGroupInvitationAction(input: unknown): Promise<InvitationResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = invitationResponseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const { invitationId, accept } = parsed.data;
  const now = new Date();

  let groupId: string;
  try {
    groupId = await prisma.$transaction(async (tx) => {
      // Seulement une invitation à ce compte, encore valable (double clic, expirée ou annulée → refus)
      const { count } = await tx.groupInvitation.updateMany({
        where: { id: invitationId, userId, ...activeInvitationWhere(now) },
        data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: now },
      });
      if (count === 0) throw new GroupActionError(INVITATION_UNAVAILABLE);

      const { groupId } = await tx.groupInvitation.findUniqueOrThrow({
        where: { id: invitationId },
        select: { groupId: true },
      });

      if (accept) {
        // Toujours en attente et sans équipe (sinon tout est annulé)
        const joined = await tx.user.updateMany({
          where: { id: userId, ...addableMemberWhere, role: "user" },
          data: { groupId, groupStatus: "JOINED", joinedAt: now },
        });
        if (joined.count === 0) throw new GroupActionError(INVITATION_UNAVAILABLE);

        // Une seule équipe : les autres invitations sont annulées
        await tx.groupInvitation.updateMany({
          where: { userId, status: "PENDING", id: { not: invitationId } },
          data: { status: "CANCELLED", respondedAt: now },
        });
      }
      return groupId;
    });
  } catch (e) {
    if (e instanceof GroupActionError) return { ok: false, error: e.message };
    throw e;
  }

  // Le groupAdmin actuel est prévenu ; le nouveau membre reçoit le courriel habituel (mode de facturation)
  after(async () => {
    const [member, group] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true, locale: true },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        select: {
          name: true,
          billingMode: true,
          users: { where: { role: "groupAdmin" }, take: 1, select: { email: true, firstName: true, locale: true } },
        },
      }),
    ]);
    if (!member || !group) return;

    const admin = group.users[0];
    if (admin) {
      await sendInvitationResponseEmail({ admin, member, groupName: group.name, accepted: accept });
    }
    if (accept) {
      await notifyAccountTypeChanges([
        {
          email: member.email,
          firstName: member.firstName,
          locale: member.locale,
          to: "member",
          groupName: group.name,
          billingMode: group.billingMode,
        },
      ]);
    }
  });
  return { ok: true };
}

// Le groupAdmin annule une invitation encore en attente de son équipe
export async function cancelGroupInvitationAction(invitationId: unknown): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = memberIdSchema.safeParse(invitationId);
  if (!parsed.success) return { ok: false, error: "invalidData" };

  const { count } = await prisma.groupInvitation.updateMany({
    where: { id: parsed.data, groupId: ctx.groupId, status: "PENDING" },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });
  if (count === 0) return { ok: false, error: INVITATION_UNAVAILABLE };

  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}

export async function removeGroupMemberAction(memberId: string): Promise<GroupResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  const parsed = memberIdSchema.safeParse(memberId);
  if (!parsed.success) return { ok: false, error: "invalidMemberId" };

  // role: "user" → impossible de retirer un admin (dont soi-même)
  const { count } = await prisma.user.updateMany({
    where: { id: parsed.data, groupId: ctx.groupId, role: "user" },
    data: { groupId: null, groupStatus: "SOLO", joinedAt: null },
  });
  if (count === 0) return { ok: false, error: "cannotRemoveMember" };

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
  if (!parsed.success) return { ok: false, error: "invalidBillingMode" };

  // Le payeur est figé sur chaque commande : le changement ne vaut que pour les prochaines
  await prisma.group.update({
    where: { id: ctx.groupId },
    data: { billingMode: parsed.data },
  });

  return { ok: true, group: await getGroupDetails(ctx.groupId) };
}