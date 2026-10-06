import { randomInt } from "node:crypto";
import type { TokenType, VerificationToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, bcryptCompare } from "@/utils/bcrypt";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import type { RegisterInput, UpdateProfileInput, UpdatePasswordInput, ForgotPasswordInput } from "../types";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const INVALID_CODE = "Invalid or expired code";

/** Un seul code actif par email et par type : l'émission d'un nouveau code invalide les précédents */
async function issueCode(email: string, type: TokenType): Promise<string> {
  const code = randomInt(100000, 1000000).toString();

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { email, type } }),
    prisma.verificationToken.create({
      data: { email, token: code, type, expires: new Date(Date.now() + CODE_TTL_MS) },
    }),
  ]);

  return code;
}

/** Vérifie un code. Chaque tentative est comptée, y compris celles qui réussissent. */
async function assertValidCode(
  email: string,
  code: string,
  type: TokenType,
): Promise<VerificationToken> {
  const token = await prisma.verificationToken.findFirst({ where: { email, type } });
  if (!token || token.expires < new Date()) throw new Error(INVALID_CODE);

  // Incrément conditionnel atomique : des requêtes simultanées ne peuvent pas dépasser la limite
  const { count } = await prisma.verificationToken.updateMany({
    where: { id: token.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });

  if (count === 0) {
    await prisma.verificationToken.deleteMany({ where: { id: token.id } });
    throw new Error("Too many attempts. Please request a new code.");
  }

  if (token.token !== code) throw new Error(INVALID_CODE);

  return token;
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const code = await issueCode(input.email, "EMAIL_VERIFICATION");
    await sendVerificationEmail(input.email, code);

    return { success: true };
  },

  async updatePassword(userId: string, input: UpdatePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new Error("User not found or no password set");
    }

    const isPasswordValid = await bcryptCompare(input.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error("Current password incorrect");
    }

    const hashedPassword = await hashPassword(input.newPassword);

    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  async verifyEmailAndCreateUser(
    email: string,
    code: string,
    firstName: string,
    lastName: string,
    password: string,
    phoneNumber: string,
    companyName: string | undefined,
    groupStatus: "SOLO" | "PENDING",
  ) {
    await assertValidCode(email, code, "EMAIL_VERIFICATION");

    const hashedPassword = await hashPassword(password);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phoneNumber,
          companyName,
          password: hashedPassword,
          emailVerified: new Date(),
          groupStatus,
        },
        select: { id: true, email: true },
      }),
      prisma.verificationToken.deleteMany({
        where: { email, type: "EMAIL_VERIFICATION" },
      }),
    ]);

    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phoneNumber: input.phoneNumber,
        companyName: input.companyName,
      },
    });
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { role: true },
    });

    // Sortie silencieuse : ne révèle ni l'existence du compte ni s'il s'agit du superAdmin
    if (!user || user.role === "superAdmin") return;

    const code = await issueCode(input.email, "PASSWORD_RESET");
    await sendPasswordResetEmail(input.email, code, input.locale);
  },

  async resetPassword(input: { email: string; code: string; password: string }) {
    await assertValidCode(input.email, input.code, "PASSWORD_RESET");

    // Défense en profondeur : refuse même si un ancien code existait
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { role: true },
    });
    if (!user || user.role === "superAdmin") throw new Error(INVALID_CODE);

    const hashedPassword = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: input.email },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.deleteMany({
        where: { email: input.email, type: "PASSWORD_RESET" },
      }),
    ]);
  },

  async verifyResetCode(email: string, code: string) {
    await assertValidCode(email, code, "PASSWORD_RESET");
    return true;
  },
};