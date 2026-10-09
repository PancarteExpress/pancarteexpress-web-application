import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const groupMemberSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  groupStatus: true,
} satisfies Prisma.UserSelect;

export type GroupMember = Prisma.UserGetPayload<{ select: typeof groupMemberSelect }>;
export type GroupDetails = { id: string; name: string; users: GroupMember[] };

export function getGroupDetails(groupId: string): Promise<GroupDetails> {
  return prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      users: { select: groupMemberSelect, orderBy: { email: "asc" } },
    },
  });
}