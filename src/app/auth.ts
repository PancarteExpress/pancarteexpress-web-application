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

        console.log("User found:", user?.email);

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcryptCompare(
          credentials.password as string,
          user.password
        );

        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("❌ Invalid password");
          return null;
        }

        console.log("✓ Authorization successful");

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        };
      },
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
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});