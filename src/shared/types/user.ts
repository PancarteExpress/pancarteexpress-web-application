// src/types/user.ts

import type { Order, Group, Session as PrismaSession } from "@prisma/client";

export type UserRole = "user" | "admin";
export type GroupStatus = "SOLO" | "PENDING" | "JOINED";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  password: string | null;
  provider: string | null;
  providerAccountId: string | null;
  role: UserRole;
  groupStatus: GroupStatus;
  groupId: string | null;
  emailVerified: Date | null;
  orders?: Order[];
  sessions?: PrismaSession[];
  group?: Group | null;
}