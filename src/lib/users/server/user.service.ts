import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Liste blanche : seuls ces champs sortent de la base (jamais le mot de passe)
const adminUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  companyName: true,
  role: true,
  groupStatus: true,
  provider: true,
  createdAt: true,
  group: { select: { name: true } },
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    where: { role: { in: ["user", "groupAdmin"] } },
    select: adminUserSelect,
    orderBy: { createdAt: "desc" },
  });
}