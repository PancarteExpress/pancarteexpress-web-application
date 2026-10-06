import type { DefaultSession } from 'next-auth';
import type { Order, Group, Session as PrismaSession } from '@prisma/client';
import 'next-auth/jwt';
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    companyName?: string | null;
    password?: string | null;
    provider?: string | null;
    providerAccountId?: string | null;
    role: UserRole;
    groupStatus: "SOLO" | "PENDING" | "JOINED";
    groupId: string | null;
    emailVerified?: Date | null;
    sessions?: PrismaSession[];
    groupName?: string | null;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    companyName?: string | null;
    password?: string | null;
    provider?: string | null;
    providerAccountId?: string | null;
    role: UserRole;
    groupStatus: "SOLO" | "PENDING" | "JOINED";
    groupId: string | null;
    emailVerified?: Date | null;
    sessions?: PrismaSession[];
    groupName: string | null;
  }
}