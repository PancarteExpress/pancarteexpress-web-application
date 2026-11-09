import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), count: vi.fn(), updateMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  group: { create: vi.fn(), delete: vi.fn() },
  $transaction: vi.fn(),
}));
const authMock = vi.hoisted(() => vi.fn());
const sendAccountDeletedEmail = vi.hoisted(() => vi.fn());
const notifyAccountTypeChanges = vi.hoisted(() => vi.fn());
// after() exécute le rappel tout de suite : pas de contexte de requête Next en test
const afterMock = vi.hoisted(() => vi.fn((callback: () => unknown) => callback()));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/app/auth", () => ({ auth: authMock }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/users/server/accountDeleted.email", () => ({ sendAccountDeletedEmail }));
vi.mock("@/lib/users/server/accountType.emails", () => ({ notifyAccountTypeChanges }));

const { deleteUserAction, updateAccountTypeAction } = await import("./user.actions");

const nonSuperAdminSessions = [null, { user: { id: "u1", role: "groupAdmin" } }, { user: { id: "u1", role: "user" } }];

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "sa", role: "superAdmin" } });
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
});

describe("deleteUserAction", () => {
  it.each(nonSuperAdminSessions)("refuse tout autre rôle que superAdmin sans toucher la base (%o)", async (session) => {
    authMock.mockResolvedValue(session);

    await expect(deleteUserAction("u2")).resolves.toEqual({ ok: false, error: "Non autorisé." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("interdit au superAdmin de supprimer son propre compte", async () => {
    await expect(deleteUserAction("sa")).resolves.toEqual({
      ok: false,
      error: "Vous ne pouvez pas supprimer votre propre compte.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse de supprimer un superAdmin", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "superAdmin", groupId: null });

    await expect(deleteUserAction("u2")).resolves.toEqual({ ok: false, error: "Impossible de supprimer un superAdmin." });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("exige un successeur pour un groupAdmin dont l'équipe a des membres", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "groupAdmin", groupId: "g1" });
    prismaMock.user.count.mockResolvedValue(2);

    await expect(deleteUserAction("u2")).resolves.toEqual({
      ok: false,
      error: "Sélectionnez un nouvel administrateur pour ce groupe.",
    });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("supprime un user simple", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user", groupId: null });

    await expect(deleteUserAction("u2")).resolves.toEqual({ ok: true });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "u2" } });
  });

  it("envoie le courriel d'au revoir après la suppression", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user", groupId: null, locale: "fr", email: "ana@example.com", firstName: "Ana" });

    await deleteUserAction("u2");

    expect(sendAccountDeletedEmail).toHaveBeenCalledWith("ana@example.com", "Ana", "fr");
  });

  it("n'envoie rien si la suppression échoue", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "superAdmin", groupId: null });

    await deleteUserAction("u2");

    expect(sendAccountDeletedEmail).not.toHaveBeenCalled();
  });

  it("traduit une contrainte de clé étrangère (P2003)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user", groupId: null });
    prismaMock.user.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", { code: "P2003", clientVersion: "test" }),
    );

    await expect(deleteUserAction("u2")).resolves.toEqual({
      ok: false,
      error: "Cet utilisateur a des données liées (commandes, etc.).",
    });
  });

  it("relance les erreurs inattendues", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("boom"));

    await expect(deleteUserAction("u2")).rejects.toThrow("boom");
  });
});

describe("updateAccountTypeAction", () => {
  it.each(nonSuperAdminSessions)("refuse tout autre rôle que superAdmin sans toucher la base (%o)", async (session) => {
    authMock.mockResolvedValue(session);

    await expect(updateAccountTypeAction("u2", "solo")).resolves.toEqual({ ok: false, error: "Non autorisé." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse un type de compte inconnu (donnée non fiable)", async () => {
    // @ts-expect-error valeur hors union, comme un client malveillant pourrait l'envoyer
    await expect(updateAccountTypeAction("u2", "superAdmin")).resolves.toEqual({
      ok: false,
      error: "Type de compte invalide.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse de modifier un superAdmin", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "superAdmin", groupStatus: "SOLO", group: null });

    await expect(updateAccountTypeAction("u2", "solo")).resolves.toEqual({
      ok: false,
      error: "Impossible de modifier un superAdmin.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("passe un user en forfait individuel", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user", groupStatus: "PENDING", group: null });

    await expect(updateAccountTypeAction("u2", "solo")).resolves.toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: "user", groupStatus: "SOLO", groupId: null, joinedAt: null },
    });
  });

  it("détache de son équipe un membre passé En attente, pour qu'il puisse être ajouté de nouveau", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      role: "user",
      groupStatus: "JOINED",
      group: { id: "g1", name: "Équipe A", _count: { users: 3 } },
    });

    await expect(updateAccountTypeAction("u2", "pending")).resolves.toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: "user", groupStatus: "PENDING", groupId: null, joinedAt: null },
    });
  });

  it("prévient le client de son nouveau type de compte", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "ana@example.com",
      firstName: "Ana",
      role: "user",
      groupStatus: "JOINED",
      group: { id: "g1", name: "Équipe A", _count: { users: 3 } },
    });

    await updateAccountTypeAction("u2", "solo");

    expect(notifyAccountTypeChanges).toHaveBeenCalledWith([
      expect.objectContaining({ email: "ana@example.com", to: "solo", groupName: "Équipe A", groupDeleted: false }),
    ]);
  });

  it("n'envoie rien si le type ne change pas", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user", groupStatus: "SOLO", group: null });

    await updateAccountTypeAction("u2", "solo");

    expect(notifyAccountTypeChanges).not.toHaveBeenCalled();
  });
});
