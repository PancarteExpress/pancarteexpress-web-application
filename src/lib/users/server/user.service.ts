import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CONFIRMED_ORDER_WHERE } from "@/lib/orders/constants";

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
  serviceBlockStartsAt: true,
  group: { select: { id: true, name: true, billingMode: true } },
  _count: { select: { orders: { where: CONFIRMED_ORDER_WHERE } } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    where: { role: { in: ["user", "groupAdmin"] } },
    select: adminUserSelect,
    orderBy: { createdAt: "desc" },
  });
}