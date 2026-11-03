import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/app/auth";

// Une seule lecture de session par requête, même si le layout et la page appellent le guard
const getSession = cache(() => auth());

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
