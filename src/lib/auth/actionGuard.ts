import "server-only";
import { auth } from "@/app/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export class ActionError extends Error {}

export async function requireSuperAdminAction() {
  const session = await auth();
  if (session?.user?.role !== "superAdmin") throw new ActionError("Non autorisé.");
  return session;
}

export function toActionError(e: unknown): ActionResult {
  if (e instanceof ActionError) return { ok: false, error: e.message };
  throw e;
}