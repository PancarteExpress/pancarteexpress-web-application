import type { GroupStatus, UserRole } from "@prisma/client";
import type { CurrentAccountType } from "./accountType";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Courtier",
  groupAdmin: "Administrateur de groupe",
  superAdmin: "Super admin",
};

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  SOLO: "Solo",
  PENDING: "Doit rejoindre un groupe",
  JOINED: "Membre d'un groupe",
};

export const ACCOUNT_TYPE_LABELS: Record<CurrentAccountType, string> = {
  solo: "Solo",
  pending: "En attente",
  groupAdmin: "Admin de groupe",
  member: "Membre",
};