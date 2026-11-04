import "server-only";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Remet le jeton à jour depuis la BD. Une panne passagère ne doit pas déconnecter
 * l'utilisateur : Auth.js effacerait le cookie si cette fonction levait une erreur.
 * @returns null si le compte n'existe plus (session invalidée)
 */
export async function refreshSessionToken(token: JWT, signedInUserId?: string): Promise<JWT | null> {
  if (signedInUserId) token.id = signedInUserId;
  if (!token.id) return token;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        companyName: true,
        role: true,
        groupStatus: true,
        groupId: true,
        group: { select: { name: true } },
      },
    });

    // Compte supprimé : la session est invalidée
    if (!dbUser) return null;

    const { group, ...profile } = dbUser;
    return { ...token, ...profile, groupName: group?.name ?? null };
  } catch (error) {
    // Connexion en cours ou jeton sans rôle : rien de fiable à conserver
    if (signedInUserId || !token.role) throw error;

    console.error("[auth:jwt] Lecture du compte impossible, jeton existant conservé", error);
    return token;
  }
}
