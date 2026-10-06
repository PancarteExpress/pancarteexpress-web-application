import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/app/auth";

// Une seule lecture de session par requête, même si le layout et la page appellent le guard
const getSession = cache(() => auth());

type ApiGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/** Pages et layouts : redirige vers la connexion si non connecté, 404 si rôle insuffisant */
export async function requireRolePage(
  roles: readonly UserRole[],
  locale: string,
): Promise<Session> {
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);
  // 404 plutôt que 403 : ne révèle pas l'existence de la zone
  if (!roles.includes(session.user.role)) notFound();
  return session;
}

/** Route handlers : renvoie une réponse 401/403 à retourner telle quelle */
export async function requireRoleApi(roles: readonly UserRole[]): Promise<ApiGuardResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (!roles.includes(session.user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { ok: true, session };
}