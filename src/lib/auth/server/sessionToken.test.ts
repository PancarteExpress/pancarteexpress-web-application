import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JWT } from "next-auth/jwt";

const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { refreshSessionToken } = await import("./sessionToken");

const existingToken = (): JWT => ({
  id: "u1",
  email: "ancien@pancarte.test",
  role: "groupAdmin",
  groupStatus: "JOINED",
  groupId: "g1",
  groupName: "Équipe",
});

const dbUser = {
  email: "nouveau@pancarte.test",
  firstName: "Alex",
  lastName: "Tremblay",
  phoneNumber: null,
  companyName: null,
  role: "user",
  groupStatus: "SOLO",
  groupId: null,
  group: null,
};

describe("refreshSessionToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("met le jeton à jour depuis la BD, y compris le rôle", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);

    const result = await refreshSessionToken(existingToken());

    expect(result).toMatchObject({
      id: "u1",
      email: "nouveau@pancarte.test",
      role: "user",
      groupId: null,
      groupName: null,
    });
    expect(result).not.toHaveProperty("group");
  });

  it("invalide la session si le compte n'existe plus", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(refreshSessionToken(existingToken())).resolves.toBeNull();
  });

  it("conserve le jeton tel quel si la base est injoignable", async () => {
    const outage = new Error("Can't reach database server");
    prismaMock.user.findUnique.mockRejectedValue(outage);

    await expect(refreshSessionToken(existingToken())).resolves.toEqual(existingToken());
    expect(console.error).toHaveBeenCalledWith(expect.any(String), outage);
  });

  it("propage l'erreur à la connexion : aucun jeton incomplet n'est émis", async () => {
    const outage = new Error("Can't reach database server");
    prismaMock.user.findUnique.mockRejectedValue(outage);

    await expect(refreshSessionToken(existingToken(), "u2")).rejects.toBe(outage);
  });

  it("propage l'erreur si le jeton n'a pas de rôle à conserver", async () => {
    const outage = new Error("Can't reach database server");
    prismaMock.user.findUnique.mockRejectedValue(outage);
    const withoutRole = { id: "u1" } as JWT;

    await expect(refreshSessionToken(withoutRole)).rejects.toBe(outage);
  });

  it("utilise l'id de l'utilisateur qui vient de se connecter", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);

    const result = await refreshSessionToken({} as JWT, "u2");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u2" } }),
    );
    expect(result).toMatchObject({ id: "u2", role: "user" });
  });

  it("ne lit pas la BD sans identifiant", async () => {
    const anonymous = {} as JWT;

    await expect(refreshSessionToken(anonymous)).resolves.toBe(anonymous);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
