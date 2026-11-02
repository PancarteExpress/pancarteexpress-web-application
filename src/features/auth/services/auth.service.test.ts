import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { publicUserSelect } from "@/lib/users/publicUser";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  verificationToken: { findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
const emailMock = vi.hoisted(() => ({
  sendAccountCreatedEmails: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/utils/bcrypt", () => ({
  hashPassword: vi.fn(async () => "new-hash"),
  bcryptCompare: vi.fn(async () => true),
}));
vi.mock("@/features/auth/services/email", () => emailMock);

const { authService } = await import("./auth.service");
const { AppError } = await import("@/lib/errors/appError");

const futureDate = () => new Date(Date.now() + 60_000);
const pastDate = () => new Date(Date.now() - 60_000);

describe("publicUserSelect", () => {
  it("n'expose aucun champ sensible", () => {
    for (const field of ["password", "providerAccountId", "provider", "role", "groupId", "serviceBlockStartsAt"]) {
      expect(publicUserSelect).not.toHaveProperty(field);
    }
  });
});

describe("authService — retours de user sans hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateProfile utilise le select public et n'écrit pas le courriel", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "ana@example.com" });
    prismaMock.user.update.mockResolvedValue({ id: "u1" });

    await authService.updateProfile("u1", {
      firstName: "Ana",
      lastName: "Roy",
      email: " Ana@Example.com ",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, select: publicUserSelect }),
    );
    expect(prismaMock.user.update.mock.calls[0][0].data).not.toHaveProperty("email");
  });

  it("updateProfile refuse un changement de courriel", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "ana@example.com" });

    await expect(
      authService.updateProfile("u1", {
        firstName: "Ana",
        lastName: "Roy",
        email: "victime@gmail.com",
      }),
    ).rejects.toMatchObject({ code: "emailChangeNotAllowed" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updatePassword utilise le select public", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", password: "old-hash" });
    prismaMock.user.update.mockResolvedValue({ id: "u1" });

    await authService.updatePassword("u1", {
      currentPassword: "old",
      newPassword: "nouveau-mdp",
      confirmPassword: "nouveau-mdp",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { password: "new-hash" }, select: publicUserSelect }),
    );
  });
});

describe("authService — erreurs métier (AppError)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$transaction.mockResolvedValue([]);
  });
  afterEach(() => vi.restoreAllMocks());

  it("updatePassword : mot de passe actuel faux → currentPasswordIncorrect", async () => {
    const { bcryptCompare } = await import("@/utils/bcrypt");
    vi.mocked(bcryptCompare).mockResolvedValueOnce(false);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", password: "old-hash" });

    await expect(
      authService.updatePassword("u1", { currentPassword: "x", newPassword: "nouveau-mdp", confirmPassword: "nouveau-mdp" }),
    ).rejects.toMatchObject({ code: "currentPasswordIncorrect" });
  });

  it("updatePassword : compte Google sans mot de passe → noPassword", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", password: null });

    await expect(
      authService.updatePassword("u1", { currentPassword: "x", newPassword: "nouveau-mdp", confirmPassword: "nouveau-mdp" }),
    ).rejects.toMatchObject({ code: "noPassword" });
  });

  it("register : échec SMTP → emailSendFailed, erreur brute journalisée seulement", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const smtp = new Error("Invalid login: 535 Authentication failed");
    emailMock.sendVerificationEmail.mockRejectedValueOnce(smtp);

    const err = await authService
      .register({ email: "ana@example.com", locale: "fr" } as Parameters<typeof authService.register>[0])
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ code: "emailSendFailed", message: "emailSendFailed" });
    expect(console.error).toHaveBeenCalledWith(expect.any(String), smtp);
  });

  it("register : compte existant → userExists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(
      authService.register({ email: "ana@example.com" } as Parameters<typeof authService.register>[0]),
    ).rejects.toMatchObject({ code: "userExists" });
  });

  it("verifyEmailAndCreateUser : P2002 (compte créé entre-temps) → userExists", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: futureDate() });
    prismaMock.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`email`)", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      authService.verifyEmailAndCreateUser("ana@example.com", "123456", "Ana", "Roy", "mdp-solide", "5145550000", undefined, "SOLO"),
    ).rejects.toMatchObject({ code: "userExists" });
  });

  it("code d'inscription : trop de tentatives → tooManyAttempts", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: futureDate() });
    prismaMock.verificationToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      authService.verifyEmailAndCreateUser("ana@example.com", "000000", "Ana", "Roy", "mdp-solide", "5145550000", undefined, "SOLO"),
    ).rejects.toMatchObject({ code: "tooManyAttempts" });
  });
});

describe("authService — anti-énumération du reset de mot de passe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$transaction.mockResolvedValue([]);
  });
  afterEach(() => vi.restoreAllMocks());

  const input = { email: "ana@example.com", locale: "fr" as const };

  it("forgotPassword : compte inexistant → résout sans envoyer de courriel", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(authService.forgotPassword(input)).resolves.toBeUndefined();
    expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("forgotPassword : superAdmin → résout sans émettre de code", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "superAdmin" });

    await expect(authService.forgotPassword(input)).resolves.toBeUndefined();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("forgotPassword : échec SMTP → résout quand même, erreur journalisée", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user" });
    const smtp = new Error("Invalid login: 535");
    emailMock.sendPasswordResetEmail.mockRejectedValueOnce(smtp);

    await expect(authService.forgotPassword(input)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith("[forgot-password]", smtp);
  });

  it("forgotPassword : échec base à l'émission du code → résout quand même", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user" });
    prismaMock.$transaction.mockRejectedValueOnce(new Error("connexion Neon perdue"));

    await expect(authService.forgotPassword(input)).resolves.toBeUndefined();
  });

  it.each([
    ["compte inexistant (aucun code)", () => prismaMock.verificationToken.findFirst.mockResolvedValue(null)],
    [
      "code expiré",
      () => prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: pastDate() }),
    ],
    [
      "code faux",
      () => {
        prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: futureDate() });
        prismaMock.verificationToken.updateMany.mockResolvedValue({ count: 1 });
      },
    ],
    [
      "trop de tentatives",
      () => {
        prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: futureDate() });
        prismaMock.verificationToken.updateMany.mockResolvedValue({ count: 0 });
      },
    ],
  ])("verifyResetCode : %s → invalidCode", async (_label, arrange) => {
    arrange();

    await expect(authService.verifyResetCode("ana@example.com", "999999")).rejects.toMatchObject({ code: "invalidCode" });
  });

  it("resetPassword : code valide mais compte disparu → invalidCode", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValue({ id: "t1", token: "123456", expires: futureDate() });
    prismaMock.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.resetPassword({ email: "ana@example.com", code: "123456", password: "nouveau-mdp" }),
    ).rejects.toMatchObject({ code: "invalidCode" });
  });
});
