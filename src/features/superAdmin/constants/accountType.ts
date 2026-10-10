import type { GroupStatus, UserRole } from "@prisma/client";

export const ACCOUNT_TYPES = ["solo", "pending", "groupAdmin"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type CurrentAccountType = AccountType | "member";

export const ACCOUNT_TYPE_LABELS: Record<CurrentAccountType, string> = {
  solo: "Solo",
  pending: "En attente",
  groupAdmin: "Admin de groupe",
  member: "Membre",
};

export function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export function getAccountType(role: UserRole, groupStatus: GroupStatus): CurrentAccountType {
  if (role === "groupAdmin") return "groupAdmin";
  if (groupStatus === "PENDING") return "pending";
  if (groupStatus === "SOLO") return "solo";
  return "member";
}