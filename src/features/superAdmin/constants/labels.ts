import type { GroupStatus, ServiceStatus, UserRole } from "@prisma/client";

// Libellés affichés : namespace i18n superAdmin (roles, groupStatuses, accountTypes, serviceTypes)

export const GROUP_STATUSES = ["SOLO", "PENDING", "JOINED"] as const satisfies readonly GroupStatus[];

// Rôles affichés dans la liste admin (le superAdmin en est exclu par listUsersForAdmin)
export const ADMIN_LIST_ROLES = ["user", "groupAdmin"] as const satisfies readonly UserRole[];
export type AdminListRole = (typeof ADMIN_LIST_ROLES)[number];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  TO_SCHEDULE: "À planifier",
  SCHEDULED: "Planifié",
  COMPLETED: "Complété",
  CANCELLED: "Annulé",
};
