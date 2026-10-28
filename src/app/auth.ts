import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { bcryptCompare } from "@/utils/bcrypt";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { sendAccountCreatedEmails, type EmailLocale } from "@/features/auth/services/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcryptCompare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

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
    error: "/error",
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
        const intent = cookieStore.get("authIntent")?.value;
        const groupStatus = (cookieStore.get("pendingGroupStatus")?.value || "SOLO") as "SOLO" | "PENDING";
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
          if (existingUser.role === "superAdmin") return false;

          if (!existingUser.provider) {
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
            },
          });

          user.id = newUser.id;
          user.firstName = firstName;
          user.lastName = lastName;

          await sendAccountCreatedEmails({
            name: fullName || email,
            email,
            provider: "google",
            locale,
          });
        }
      }

      return true;
    },
    
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (!token.id) return token;

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
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});