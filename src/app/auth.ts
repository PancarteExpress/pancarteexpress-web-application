import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { bcryptCompare } from "@/utils/bcrypt";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { cookies } from "next/headers";

interface JWTParams {
  token: JWT;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

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
          console.log("❌ Email or password missing");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
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
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id && !user?.email) return false;

      if (account?.provider === "google" && user.email) {
        const fullName = user.name || "";
        const parts = fullName.split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        const cookieStore = await cookies();
        const groupStatus = (cookieStore.get('pendingGroupStatus')?.value || 'SOLO') as 'SOLO' | 'PENDING';

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // User existe — mettre à jour provider si nécessaire
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
        } else {
          // User n'existe pas — créer User avec provider OAuth
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
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
        }

        cookieStore.delete('pendingGroupStatus');
      }
      return true;
    },
    async jwt({ token, user }: JWTParams): Promise<JWT> {
      if (user) {
        if (user.id) token.id = user.id;
        
        token.firstName = user.firstName || "";
        token.lastName = user.lastName || "";
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            orders: true,
            group: true,
          },
        });
        
        if (dbUser) {
          return { ...token, ...dbUser } as JWT;
        }
      }

      return token;
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
        session.user.createdAt = token.createdAt;    // ← Ajoute ça
        session.user.updatedAt = token.updatedAt;
        session.user.orders = token.orders;
        session.user.group = token.group;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});