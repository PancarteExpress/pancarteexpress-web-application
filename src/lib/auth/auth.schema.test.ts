import { describe, expect, it } from "vitest";
import {
  codeSchema,
  loginSchema,
  passwordSchema,
  registerPlanSchema,
  registerSchema,
  resetPasswordRequestSchema,
  storeGroupStatusSchema,
  updatePasswordSchema,
  verifyEmailSchema,
  verifyResetCodeSchema,
} from "./auth.schema";

describe("passwordSchema", () => {
  it("exige 8 à 72 caractères", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
  });

  it("s'applique à l'inscription et au changement de mot de passe", () => {
    expect(
      registerSchema.safeParse({
        firstName: "Ana",
        lastName: "Roy",
        email: "ana@example.com",
        password: "abc",
        confirmPassword: "abc",
        phoneNumber: "5145550000",
      }).success,
    ).toBe(false);
    expect(
      updatePasswordSchema.safeParse({ currentPassword: "x", newPassword: "abc", confirmPassword: "abc" }).success,
    ).toBe(false);
  });

  it("ne s'applique pas au login (comptes existants au mot de passe court)", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "abc" }).success).toBe(true);
  });
});

describe("storeGroupStatusSchema", () => {
  it("accepte SOLO et PENDING", () => {
    expect(storeGroupStatusSchema.safeParse({ intent: "register", groupStatus: "PENDING" }).success).toBe(true);
    expect(storeGroupStatusSchema.safeParse({ intent: "login", groupStatus: "SOLO" }).success).toBe(true);
  });

  it("refuse JOINED, une valeur inconnue ou un intent invalide", () => {
    expect(storeGroupStatusSchema.safeParse({ intent: "register", groupStatus: "JOINED" }).success).toBe(false);
    expect(storeGroupStatusSchema.safeParse({ intent: "register", groupStatus: "ADMIN" }).success).toBe(false);
    expect(storeGroupStatusSchema.safeParse({ intent: "hack", groupStatus: "SOLO" }).success).toBe(false);
  });
});

describe("codeSchema", () => {
  it.each(["123456", "000000"])("accepte %s", (code) => {
    expect(codeSchema.safeParse(code).success).toBe(true);
  });

  it.each(["12345", "1234567", "12a456", " 12345", "١٢٣٤٥٦"])("refuse %s", (code) => {
    expect(codeSchema.safeParse(code).success).toBe(false);
  });

  it("s'applique à la vérification d'inscription et de réinitialisation", () => {
    expect(verifyResetCodeSchema.safeParse({ email: "a@b.co", code: "12a456" }).success).toBe(false);
    expect(verifyEmailSchema.shape.code.safeParse("12a456").success).toBe(false);
  });
});

describe("resetPasswordRequestSchema", () => {
  const valid = { email: " Ana@Example.com ", code: "123456", password: "motdepasse", confirmPassword: "motdepasse" };

  it("normalise le courriel et accepte une demande valide", () => {
    const parsed = resetPasswordRequestSchema.parse(valid);
    expect(parsed.email).toBe("ana@example.com");
  });

  it("refuse des mots de passe différents, sur confirmPassword", () => {
    const result = resetPasswordRequestSchema.safeParse({ ...valid, confirmPassword: "autrechose" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("applique les mêmes règles que le formulaire (longueur, code)", () => {
    expect(resetPasswordRequestSchema.safeParse({ ...valid, password: "court", confirmPassword: "court" }).success).toBe(false);
    expect(resetPasswordRequestSchema.safeParse({ ...valid, code: "12345" }).success).toBe(false);
  });
});

describe("registerPlanSchema", () => {
  it("accepte solo et group", () => {
    expect(registerPlanSchema.safeParse("solo").success).toBe(true);
    expect(registerPlanSchema.safeParse("group").success).toBe(true);
  });

  it("refuse none, une valeur inconnue, un tableau ou l'absence de valeur", () => {
    expect(registerPlanSchema.safeParse("none").success).toBe(false);
    expect(registerPlanSchema.safeParse("PENDING").success).toBe(false);
    expect(registerPlanSchema.safeParse(["solo", "group"]).success).toBe(false);
    expect(registerPlanSchema.safeParse(undefined).success).toBe(false);
  });
});
