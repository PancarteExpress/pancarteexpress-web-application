import "server-only";
import type { BillingMode, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AdminGroupRow {
  id: string;
  name: string | null;
  billingMode: BillingMode;
  createdAt: Date;
  memberCount: number;
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

const groupMemberSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  groupStatus: true,
} satisfies Prisma.UserSelect;

export type GroupMember = Prisma.UserGetPayload<{ select: typeof groupMemberSelect }>;

const groupInvitationSelect = {
  id: true,
  expiresAt: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.GroupInvitationSelect;

const groupDetailsSelect = {
  id: true,
  name: true,
  billingMode: true,
  users: { select: groupMemberSelect, orderBy: { email: "asc" } },
  invitations: { where: { status: "PENDING" }, select: groupInvitationSelect, orderBy: { createdAt: "desc" } },
} satisfies Prisma.GroupSelect;

export type PendingGroupInvitation = Prisma.GroupInvitationGetPayload<{ select: typeof groupInvitationSelect }>;
export type GroupDetails = Prisma.GroupGetPayload<{ select: typeof groupDetailsSelect }>;

export async function listGroupsForAdmin(): Promise<AdminGroupRow[]> {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      billingMode: true,
      createdAt: true,
      _count: { select: { users: true } },
      users: {
        where: { role: "groupAdmin" },
        take: 1,
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return groups.map(({ _count, users, ...group }) => ({
    ...group,
    memberCount: _count.users,
    admin: users[0] ?? null,
  }));
}

export async function getGroupDetails(groupId: string): Promise<GroupDetails> {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: groupDetailsSelect,
  });
  // Expirées filtrées ici : le select est créé une seule fois, il ne peut pas contenir « maintenant »
  const now = Date.now();
  return { ...group, invitations: group.invitations.filter((i) => i.expiresAt.getTime() > now) };
}

const userInvitationSelect = {
  id: true,
  expiresAt: true,
  group: { select: { name: true } },
} satisfies Prisma.GroupInvitationSelect;

export type UserGroupInvitation = Prisma.GroupInvitationGetPayload<{ select: typeof userInvitationSelect }>;

export function getPendingInvitationsForUser(userId: string): Promise<UserGroupInvitation[]> {
  return prisma.groupInvitation.findMany({
    where: { userId, status: "PENDING", expiresAt: { gt: new Date() } },
    select: userInvitationSelect,
    orderBy: { createdAt: "desc" },
  });
}