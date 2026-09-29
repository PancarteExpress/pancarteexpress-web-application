import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { bcryptCompare } from "@/utils/bcrypt";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

interface SignInParams {
  user: { 
    id?: string; 
    email?: string; 
    name?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  account: { 
    provider?: string;
    providerAccountId?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
  } | null;
}

interface JWTParams {
  token: JWT;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// @ts-expect-error NextAuth types are complex and not fully compatible with strict mode
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Pas de PrismaAdapter — on gère tout dans les callbacks
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
    async signIn({ user, account }: SignInParams) {
      
      if (!user?.id) return false;

      if (account?.provider === "google" && user.email) {
        const fullName = user.name || "";
        const parts = fullName.split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // User existe — crée/met à jour l'Account
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider as string,
                providerAccountId: account.providerAccountId as string,
              },
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type || "oauth",
                provider: account.provider as string,
                providerAccountId: account.providerAccountId as string,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }

          user.id = existingUser.id;
          user.firstName = existingUser.firstName;
          user.lastName = existingUser.lastName;
        } else {
          // User n'existe pas — crée User + Account
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              firstName,
              lastName,
              emailVerified: new Date(),
            },
          });

          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type || "oauth",
              provider: account.provider,
              providerAccountId: account.providerAccountId || "",
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });

          user.id = newUser.id;
          user.firstName = firstName;
          user.lastName = lastName;
        }
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