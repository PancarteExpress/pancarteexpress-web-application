import type { ServiceStatus, ServiceType } from "@prisma/client";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  installation: "Installation",
  removal: "Retrait",
  correction: "Correction",
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  TO_SCHEDULE: "À planifier",
  SCHEDULED: "Planifié",
  COMPLETED: "Complété",
  CANCELLED: "Annulé",
};