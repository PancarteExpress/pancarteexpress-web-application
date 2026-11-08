import * as z from "zod";
import type { GroupStatus } from "@prisma/client";

// Liste locale : importer l'enum runtime de @prisma/client côté client est à éviter
export const GROUP_STATUSES = ["SOLO", "PENDING", "JOINED"] as const satisfies readonly GroupStatus[];

// Valeur absente, invalide ou répétée (?groupStatus=a&groupStatus=b) → aucun filtre
export const groupStatusFilterSchema = z.enum(GROUP_STATUSES).optional().catch(undefined);
export type GroupStatusFilter = z.infer<typeof groupStatusFilterSchema>;