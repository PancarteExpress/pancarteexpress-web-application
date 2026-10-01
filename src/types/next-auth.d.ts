import type { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module "next-auth" {
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: "user" | "admin";
    groupId?: string | null;
    emailVerified?: Date | null;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: "user" | "admin";
      groupId: string | null;
      emailVerified: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: "user" | "admin";
    groupId?: string | null;
  }
}

declare module '@auth/core/types' {
  interface User {
    firstName?: string | null;
    lastName?: string | null;
    role?: 'user' | 'admin';
    groupId?: string | null;
  }
}