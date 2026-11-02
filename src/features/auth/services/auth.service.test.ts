import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicUserSelect } from "@/lib/users/publicUser";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/utils/bcrypt", () => ({
  hashPassword: vi.fn(async () => "new-hash"),
  bcryptCompare: vi.fn(async () => true),
}));
vi.mock("@/features/auth/services/email", () => ({
  sendAccountCreatedEmails: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

const { authService } = await import("./auth.service");

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

  it("updateProfile utilise le select public", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({ id: "u1" });

    await authService.updateProfile("u1", {
      firstName: "Ana",
      lastName: "Roy",
      email: "ana@example.com",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, select: publicUserSelect }),
    );
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
