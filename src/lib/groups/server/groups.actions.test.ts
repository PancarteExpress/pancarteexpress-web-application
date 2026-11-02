import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
const authMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/app/auth", () => ({ auth: authMock }));
vi.mock("./groups.service", () => ({ getGroupDetails: vi.fn(async () => ({ id: "g1" })) }));

const { searchUsersByEmailAction, addGroupMembersAction } = await import("./groups.actions");

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
