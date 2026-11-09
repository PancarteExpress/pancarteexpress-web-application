import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/server/password";
import { isLegacyHash, verifyPassword } from "@/lib/auth/server/legacyPassword";
import { refreshSessionToken } from "@/lib/auth/server/sessionToken";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import type { EmailLocale } from "@/lib/auth/server/authEmails";
import { authIntentSchema, loginSchema, signupGroupStatusSchema } from "@/lib/auth/auth.schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        // « @ » : courriel ; sinon nom d'utilisateur repris de WordPress
        const user = await prisma.user.findUnique({
          where: identifier.includes("@") ? { email: identifier } : { username: identifier },
        });
        if (!user?.password) return null;

        if (!(await verifyPassword(password, user.password))) return null;

        // Premier login d'un compte migré : on remplace le hash WordPress par du bcrypt.
        // Un échec ici ne bloque pas la connexion ; on réessaiera au prochain login.
        if (isLegacyHash(user.password)) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { password: await hashPassword(password) },
            });
          } catch (e) {
            console.error("[auth] re-hash du mot de passe WordPress échoué", e);
          }
        }

        // Retourne tous les champs requis par l'interface User
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          groupStatus: user.groupStatus,
          groupId: user.groupId,
        };
      }
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login", // Auth.js ajoute ?error=<code>, affiché par LoginErrorMessage
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id && !user?.email) return false;

      if (account?.provider === "google" && user.email) {
        const fullName = user.name || "";
        const parts = fullName.split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        const email = user.email.trim().toLowerCase();

        const cookieStore = await cookies();
        const intent = authIntentSchema.safeParse(cookieStore.get("authIntent")?.value).data;
        const groupStatus =
          signupGroupStatusSchema.safeParse(cookieStore.get("pendingGroupStatus")?.value).data ?? "SOLO";
        const locale: EmailLocale = cookieStore.get("pendingLocale")?.value === "en" ? "en" : "fr";

        cookieStore.delete("authIntent");
        cookieStore.delete("pendingGroupStatus");
        cookieStore.delete("pendingLocale");

        const existingUser = await prisma.user.findUnique({ where: { email } });

        // Connexion : le compte doit exister, sinon on ne crée rien
        if (intent === "login" && !existingUser) {
          return `/${locale}/login?error=no_account`;
        }

        // Inscription : le compte ne doit pas exister
        if (intent === "register" && existingUser) {
          return `/${locale}/login?error=account_exists`;
        }

        if (existingUser) {
          if (existingUser.role === "superAdmin") return `/${locale}/login?error=AccessDenied`;

          if (!existingUser.provider) {
            // Liaison Google seulement si l'adresse du compte a été vérifiée
            if (!existingUser.emailVerified) {
              return `/${locale}/login?error=account_exists`;
            }
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
          }

          user.id = existingUser.id;
          user.firstName = existingUser.firstName;
          user.lastName = existingUser.lastName;
          // Connexion d'un compte existant : pas de courriel de création
        } else {
          // Inscription : création du compte
          const newUser = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              emailVerified: new Date(),
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              groupStatus,
              locale, 
              needsPickupInfo: true,
            },
          });

          user.id = newUser.id;
          user.firstName = firstName;
          user.lastName = lastName;

          // Bienvenue et notification interne partent après la question de ramassage (/api/auth/complete-pickup)
        }
      }

      return true;
    },
    
    async jwt({ token, user }) {
      return refreshSessionToken(token, user?.id);
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;              // ← Ajoute ça
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.phoneNumber = token.phoneNumber;
        session.user.companyName = token.companyName;
        session.user.role = token.role;                // ← Ajoute ça aussi
        session.user.groupStatus = token.groupStatus;
        session.user.groupId = token.groupId;
        session.user.groupName = token.groupName;
        session.user.needsPickupInfo = token.needsPickupInfo;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});