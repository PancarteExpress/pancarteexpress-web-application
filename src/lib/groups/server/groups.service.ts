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

const groupDetailsSelect = {
  id: true,
  name: true,
  billingMode: true,
  users: { select: groupMemberSelect, orderBy: { email: "asc" } },
} satisfies Prisma.GroupSelect;

export type GroupMember = Prisma.UserGetPayload<{ select: typeof groupMemberSelect }>;
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

export function getGroupDetails(groupId: string): Promise<GroupDetails> {
  return prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: groupDetailsSelect,
  });
}