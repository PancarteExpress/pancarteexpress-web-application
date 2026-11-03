import { describe, expect, it } from "vitest";
import {
  loginSchema,
  passwordSchema,
  registerSchema,
  storeGroupStatusSchema,
  updatePasswordSchema,
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
