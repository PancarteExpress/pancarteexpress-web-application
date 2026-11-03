import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  group: { update: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  $transaction: vi.fn(),
}));
const authMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/app/auth", () => ({ auth: authMock }));
vi.mock("./groups.service", () => ({ getGroupDetails: vi.fn(async () => ({ id: "g1" })) }));

const { searchUsersByEmailAction, addGroupMembersAction, renameGroupAction, deleteGroupAction } = await import("./groups.actions");

describe("searchUsersByEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    prismaMock.user.findMany.mockResolvedValue([]);
  });

  it("ne cherche que les users PENDING sans groupe", async () => {
    await searchUsersByEmailAction(" Ana@ ");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: { startsWith: "ana@" },
          groupId: null,
          groupStatus: "PENDING",
          role: "user",
        }),
      }),
    );
  });

  it("refuse une requête invalide sans interroger la base", async () => {
    await expect(searchUsersByEmailAction("ab")).resolves.toEqual([]);
    await expect(searchUsersByEmailAction(42)).resolves.toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("refuse un user qui n'est pas groupAdmin", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "user" } });

    await expect(searchUsersByEmailAction("ana@")).resolves.toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});

describe("addGroupMembersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    prismaMock.user.findUnique.mockResolvedValue({ role: "groupAdmin", groupId: "g1" });
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
  });

  it("n'ajoute que des users PENDING sans groupe et date leur entrée", async () => {
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(addGroupMembersAction({ memberIds: ["m1"] })).resolves.toMatchObject({ ok: true });

    const call = prismaMock.user.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: { in: ["m1"] }, groupId: null, groupStatus: "PENDING", role: "user" });
    expect(call.data).toMatchObject({ groupId: "g1", groupStatus: "JOINED" });
    expect(call.data.joinedAt).toBeInstanceOf(Date);
  });

  it("refuse si un user n'est pas éligible (SOLO ou déjà en groupe)", async () => {
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(addGroupMembersAction({ memberIds: ["solo"] })).resolves.toEqual({
      ok: false,
      error: "Un ou plusieurs coéquipiers ne sont plus disponibles",
    });
  });
});

describe("renameGroupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    prismaMock.user.findUnique.mockResolvedValue({ role: "groupAdmin", groupId: "g1" });
  });

  it("renvoie la clé i18n nameTaken si le nom existe déjà (P2002)", async () => {
    prismaMock.group.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test" }),
    );

    await expect(renameGroupAction({ name: "Équipe A" })).resolves.toEqual({ ok: false, errorKey: "nameTaken" });
  });

  it("relance les autres erreurs Prisma", async () => {
    prismaMock.group.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "test" }),
    );

    await expect(renameGroupAction({ name: "Équipe A" })).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });
});

describe("deleteGroupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "sa", role: "superAdmin" } });
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
    prismaMock.group.findUnique.mockResolvedValue({ id: "g1" });
  });

  it.each([null, { user: { id: "u1", role: "groupAdmin" } }, { user: { id: "u1", role: "user" } }])(
    "refuse tout autre rôle que superAdmin sans toucher la base (%o)",
    async (session) => {
      authMock.mockResolvedValue(session);

      await expect(deleteGroupAction("g1")).resolves.toEqual({ ok: false, error: "Non autorisé." });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    },
  );

  it("passe les membres en forfait individuel puis supprime l'équipe", async () => {
    await expect(deleteGroupAction("g1")).resolves.toEqual({ ok: true });

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { groupId: "g1" },
      data: { role: "user", groupStatus: "SOLO", groupId: null, joinedAt: null },
    });
    expect(prismaMock.group.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
  });

  it("renvoie une erreur métier si l'équipe n'existe pas", async () => {
    prismaMock.group.findUnique.mockResolvedValue(null);

    await expect(deleteGroupAction("g1")).resolves.toEqual({ ok: false, error: "Équipe introuvable." });
    expect(prismaMock.group.delete).not.toHaveBeenCalled();
  });

  it("traduit une contrainte de clé étrangère (P2003)", async () => {
    prismaMock.group.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", { code: "P2003", clientVersion: "test" }),
    );

    await expect(deleteGroupAction("g1")).resolves.toEqual({
      ok: false,
      error: "Cette équipe a des données liées (commandes, etc.).",
    });
  });

  it("relance les erreurs inattendues", async () => {
    prismaMock.group.delete.mockRejectedValue(new Error("boom"));

    await expect(deleteGroupAction("g1")).rejects.toThrow("boom");
  });
});
