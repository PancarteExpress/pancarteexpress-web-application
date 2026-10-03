import type { DefaultSession } from 'next-auth';
import type { Order, Group, Session as PrismaSession } from '@prisma/client';
import 'next-auth/jwt';

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
    role: "user" | "admin";
    groupStatus: "SOLO" | "PENDING" | "JOINED";
    groupId: string | null;
    emailVerified?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    orders?: Order[];
    sessions?: PrismaSession[];
    group?: Group | null;
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
    role: "user" | "admin";
    groupStatus: "SOLO" | "PENDING" | "JOINED";
    groupId: string | null;
    emailVerified?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    orders?: Order[];
    sessions?: PrismaSession[];
    group?: Group | null;
  }
}