import { prisma } from "@/lib/prisma";
import { hashPassword, bcryptCompare } from "@/utils/bcrypt";
import { sendVerificationEmail } from "@/lib/email";
import type { RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "../types";
import crypto from "crypto";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Générer un code 6 chiffres
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Stocker le code dans VerificationToken
    await prisma.verificationToken.create({
      data: {
        email: input.email,
        token: code,
        expires,
        type: "EMAIL_VERIFICATION",
      },
    });

    // Envoyer l'email
    await sendVerificationEmail(input.email, code);

    // Retourner les données pour créer l'user après vérif
    return {
      email: input.email,
      name: input.name,
      isGroup: input.isGroup,
      groupName: input.groupName,
      message: "Vérification email envoyée",
    };
  },

  async verifyEmailAndCreateUser(
    email: string,
    code: string,
    name: string,
    password: string,
    isGroup: boolean,
    groupName?: string
  ) {
    // Vérifier le token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: code },
    });

    if (!verificationToken || verificationToken.email !== email) {
      throw new Error("Invalid code");
    }

    if (verificationToken.expires < new Date()) {
      throw new Error("Code expired");
    }

    // Créer l'user
    const hashedPassword = await hashPassword(password);

    let groupId: string | null = null;
    if (isGroup && groupName) {
      const group = await prisma.group.create({
        data: { name: groupName },
      });
      groupId = group.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        groupId,
      },
    });

    // Supprimer le token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { id: user.id, email: user.email };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { group: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcryptCompare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return user;
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      return { message: "Email sent if account exists" };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        expires,
        type: "PASSWORD_RESET",
        userId: user.id,
      },
    });

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, token);

    return { message: "Email sent if account exists" };
  },

  async resetPassword(input: ResetPasswordInput) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: input.token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new Error("Invalid or expired token");
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.update({
      where: { id: verificationToken.userId! },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { id: user.id, email: user.email };
  },
};