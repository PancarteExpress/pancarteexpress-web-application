import { prisma } from "@/lib/prisma";
import { hashPassword, bcryptCompare } from "@/utils/bcrypt";
import { sendVerificationEmail } from "@/lib/email";
import type { RegisterInput, ForgotPasswordInput, ResetPasswordInput, UpdateProfileInput, UpdatePasswordInput, SignInParams } from "../types";
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

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        email: input.email,
        token: code,
        expires,
        type: "EMAIL_VERIFICATION",
      },
    });

    await sendVerificationEmail(input.email, code);

    return {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      isGroup: input.isGroup,
      groupName: input.groupName,
      message: "Vérification email envoyée",
    };
  },

  async signIn(params: SignInParams) {
    const { user, account } = params;
    if (account?.provider === "google" && user.email) {
      const fullName = user.name || "";
      const parts = fullName.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // User existe déjà (créé via credentials) — crée l'Account
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: account.type as string || "oauth",
            provider: account.provider,
            providerAccountId: account.providerAccountId as string || "",
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });
      } else {
        // User n'existe pas — crée-le + Account
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
            type: (account.type as string) || "oauth",
            provider: (account.provider as string) || "google",
            providerAccountId: (account.providerAccountId as string) || "",
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

  async updatePassword(userId: string, input: UpdatePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new Error("User not found or no password set");
    }

    const isPasswordValid = await bcryptCompare(
      input.currentPassword,
      user.password
    );

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
    isGroup: boolean,
    groupName?: string
  ) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: code },
    });

    if (!verificationToken || verificationToken.email !== email) {
      throw new Error("Invalid code");
    }

    if (verificationToken.expires < new Date()) {
      throw new Error("Code expired");
    }

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
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: new Date(),
        groupId,
      },
    });

    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { id: user.id, email: user.email };
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
      },
    });
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