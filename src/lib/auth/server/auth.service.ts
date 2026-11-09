import { randomInt } from "node:crypto";
import { Prisma, type TokenType, type VerificationToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors/appError";
import { hashPassword, bcryptCompare } from "@/lib/auth/server/password";
import { publicUserSelect } from "@/lib/users/publicUser";

import {
  sendAccountCreatedEmails,
  sendPasswordResetEmail,
  sendVerificationEmail,
  type EmailLocale,
} from "@/lib/auth/server/authEmails";

import type { RegisterInput, UpdateProfileInput, UpdatePasswordInput, ForgotPasswordInput } from "@/lib/auth/auth.schema";
import { PickupCreateData } from "./pickup";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

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
  if (!token || token.expires < new Date()) throw new AppError("invalidCode");

  // Incrément conditionnel atomique : des requêtes simultanées ne peuvent pas dépasser la limite
  const { count } = await prisma.verificationToken.updateMany({
    where: { id: token.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });

  if (count === 0) {
    await prisma.verificationToken.deleteMany({ where: { id: token.id } });
    // Anti-énumération : un code de reset n'existe que pour un compte réel ; « trop de tentatives »
    // révélerait donc l'existence du compte. Même réponse qu'un code faux ou expiré.
    throw new AppError(type === "PASSWORD_RESET" ? "invalidCode" : "tooManyAttempts");
  }

  if (token.token !== code) throw new AppError("invalidCode");

  return token;
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError("userExists");
    }

    const code = await issueCode(input.email, "EMAIL_VERIFICATION");
    try {
      await sendVerificationEmail(input.email, code, input.locale);
    } catch (err) {
      console.error("[register] envoi du code de vérification", err);
      throw new AppError("emailSendFailed");
    }

    return { success: true };
  },

  async updatePassword(userId: string, input: UpdatePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppError("userNotFound");
    if (!user.password) throw new AppError("noPassword");

    const isPasswordValid = await bcryptCompare(input.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError("currentPasswordIncorrect");
    }

    const hashedPassword = await hashPassword(input.newPassword);

    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: publicUserSelect,
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
    locale: EmailLocale = "fr",
    pickup?: PickupCreateData
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
          locale,
          pickupInfo: pickup ? { create: pickup } : undefined,
        },
        select: publicUserSelect,
      }),
      prisma.verificationToken.deleteMany({
        where: { email, type: "EMAIL_VERIFICATION" },
      }),
    ]).catch((e: unknown) => {
      // Compte créé entre-temps (double envoi, inscription Google) : erreur métier, pas de détail Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new AppError("userExists");
      throw e;
    });

    // Ne lève jamais : un échec du courriel de bienvenue est journalisé, le compte est déjà créé
    await sendAccountCreatedEmails({
      name: `${firstName} ${lastName}`,
      email: user.email,
      provider: "credentials",
      locale,
      groupStatus,
      phoneNumber,
      companyName,
      pickup,
    });

    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!current) {
      throw new AppError("userNotFound");
    }

    // Changement de courriel bloqué : sans re-vérification, il permettait de préempter
    // l'adresse d'un tiers (puis la liaison Google lui ouvrait ce compte).
    // TODO: flux de changement de courriel avec code envoyé à la nouvelle adresse ;
    // emailVerified devra repasser à null jusqu'à la validation du code.
    if (input.email.trim().toLowerCase() !== current.email.toLowerCase()) {
      throw new AppError("emailChangeNotAllowed");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        companyName: input.companyName,
      },
      select: publicUserSelect,
    });
  },

  /**
   * Anti-énumération : ne lève jamais. Compte inexistant, superAdmin, échec base ou SMTP :
   * l'appelant renvoie toujours la même réponse ; les échecs ne sont que journalisés.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { role: true },
      });

      // Sortie silencieuse : ne révèle ni l'existence du compte ni s'il s'agit du superAdmin
      if (!user || user.role === "superAdmin") return;

      const code = await issueCode(input.email, "PASSWORD_RESET");
      await sendPasswordResetEmail(input.email, code, input.locale);
    } catch (err) {
      console.error("[forgot-password]", err);
    }
  },

  async resetPassword(input: { email: string; code: string; password: string }) {
    await assertValidCode(input.email, input.code, "PASSWORD_RESET");

    // Défense en profondeur : refuse même si un ancien code existait
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { role: true },
    });
    if (!user || user.role === "superAdmin") throw new AppError("invalidCode");

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