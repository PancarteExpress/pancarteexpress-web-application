import type { ServiceStatus } from "@prisma/client";

/** Statuts d'un service, dans l'ordre du menu de l'admin (partagé client / serveur) */
export const SERVICE_STATUSES = ["TO_SCHEDULE", "SCHEDULED", "COMPLETED", "CANCELLED"] as const satisfies readonly ServiceStatus[];

export function isServiceStatus(value: unknown): value is ServiceStatus {
  return typeof value === "string" && (SERVICE_STATUSES as readonly string[]).includes(value);
}