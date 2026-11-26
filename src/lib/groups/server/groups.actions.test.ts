import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(async (): Promise<unknown[]> => []),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  group: { update: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  groupInvitation: {
    findMany: vi.fn(async (): Promise<unknown[]> => []),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  $transaction: vi.fn(),
}));
const authMock = vi.hoisted(() => vi.fn());
const notifyAccountTypeChanges = vi.hoisted(() => vi.fn());
const invitationEmails = vi.hoisted(() => ({
  sendGroupInvitationEmails: vi.fn(),
  sendInvitationResponseEmail: vi.fn(),
}));
// after() exécute le rappel tout de suite : pas de contexte de requête Next en test
const afterMock = vi.hoisted(() => vi.fn((callback: () => unknown) => callback()));
const { rateLimitMock } = vi.hoisted(() => ({ rateLimitMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/app/auth", () => ({ auth: authMock }));
vi.mock("./groups.service", () => ({ getGroupDetails: vi.fn(async () => ({ id: "g1" })) }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/users/server/accountType.emails", () => ({ notifyAccountTypeChanges }));
vi.mock("./groupInvitation.emails", () => invitationEmails);
vi.mock("@/lib/rateLimit/server/rateLimit", () => ({
  isRateLimited: rateLimitMock,
  LIMITS: { memberSearchUser: {} },
}));

const {
  searchUsersByEmailAction,
  inviteGroupMembersAction,
  respondToGroupInvitationAction,
  cancelGroupInvitationAction,
  renameGroupAction,
  deleteGroupAction,
} = await import("./groups.actions");

// Laisse finir les courriels lancés dans after() (non attendus par l'action)
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const runTransaction = async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock);
const INVITATION_ID = "cinvitation01";

describe("searchUsersByEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    rateLimitMock.mockResolvedValue(false);
    prismaMock.user.findMany.mockResolvedValue([]);
  });

  it("cherche le courriel exact parmi les users PENDING sans groupe", async () => {
    await expect(searchUsersByEmailAction(" Ana@exemple.com ")).resolves.toEqual({ ok: true, users: [] });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: { equals: "Ana@exemple.com", mode: "insensitive" },
          groupId: null,
          groupStatus: "PENDING",
          role: "user",
          id: { not: "admin" },
        }),
        take: 1,
      }),
    );
  });

  it("refuse un courriel partiel sans compter d'essai ni interroger la base", async () => {
    await expect(searchUsersByEmailAction("ana@")).resolves.toEqual({ ok: false, error: "invalidEmail" });
    await expect(searchUsersByEmailAction("ana")).resolves.toEqual({ ok: false, error: "invalidEmail" });
    await expect(searchUsersByEmailAction(42)).resolves.toEqual({ ok: false, error: "invalidEmail" });
    expect(rateLimitMock).not.toHaveBeenCalled();
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("bloque après trop de recherches", async () => {
    rateLimitMock.mockResolvedValue(true);

    await expect(searchUsersByEmailAction("ana@exemple.com")).resolves.toEqual({ ok: false, error: "tooManyAttempts" });
    expect(rateLimitMock).toHaveBeenCalledWith("memberSearch", [
      expect.objectContaining({ key: "user:admin" }),
    ]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("refuse un user qui n'est pas groupAdmin", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "user" } });

    await expect(searchUsersByEmailAction("ana@exemple.com")).resolves.toEqual({ ok: true, users: [] });
    expect(rateLimitMock).not.toHaveBeenCalled();
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});

describe("inviteGroupMembersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    prismaMock.user.findUnique.mockResolvedValue({ role: "groupAdmin", groupId: "g1" });
    prismaMock.$transaction.mockImplementation(runTransaction);
    prismaMock.groupInvitation.findMany.mockResolvedValue([]);
  });

  it("invite seulement des users PENDING sans groupe, pour 14 jours, sans les lier à l'équipe", async () => {
    prismaMock.user.count.mockResolvedValue(1);

    await expect(inviteGroupMembersAction({ memberIds: ["m1"] })).resolves.toMatchObject({ ok: true });

    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: { id: { in: ["m1"] }, groupId: null, groupStatus: "PENDING", role: "user" },
    });
    const call = prismaMock.groupInvitation.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ groupId_userId: { groupId: "g1", userId: "m1" } });
    expect(call.update).toMatchObject({ status: "PENDING", respondedAt: null });
    const days = (call.create.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(13.9);
    expect(days).toBeLessThanOrEqual(14);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("n'envoie le courriel qu'aux personnes pas déjà invitées", async () => {
    prismaMock.user.count.mockResolvedValue(2);
    prismaMock.groupInvitation.findMany.mockResolvedValue([{ userId: "m1" }]);
    prismaMock.user.findMany.mockResolvedValue([{ email: "b@example.com", firstName: "Bea", locale: "fr" }]);
    prismaMock.group.findUnique.mockResolvedValue({ name: "Équipe A" });

    await inviteGroupMembersAction({ memberIds: ["m1", "m2"] });
    await flush();

    expect(prismaMock.groupInvitation.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.groupInvitation.upsert.mock.calls[0][0].where).toEqual({
      groupId_userId: { groupId: "g1", userId: "m2" },
    });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ["m2"] } } }));
    expect(invitationEmails.sendGroupInvitationEmails).toHaveBeenCalledWith(
      [{ email: "b@example.com", firstName: "Bea", locale: "fr" }],
      "Équipe A",
    );
  });

  it("refuse si un user n'est pas éligible (SOLO ou déjà en groupe)", async () => {
    prismaMock.user.count.mockResolvedValue(0);

    await expect(inviteGroupMembersAction({ memberIds: ["solo"] })).resolves.toEqual({
      ok: false,
      error: "memberUnavailable",
    });
    expect(prismaMock.groupInvitation.upsert).not.toHaveBeenCalled();
    expect(invitationEmails.sendGroupInvitationEmails).not.toHaveBeenCalled();
  });
});

describe("respondToGroupInvitationAction", () => {
  const member = { email: "ana@example.com", firstName: "Ana", lastName: "Roy", locale: "fr" };
  const admin = { email: "boss@example.com", firstName: "Bob", locale: "fr" };

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "u1", role: "user" } });
    prismaMock.$transaction.mockImplementation(runTransaction);
    prismaMock.groupInvitation.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.groupInvitation.findUniqueOrThrow.mockResolvedValue({ groupId: "g1" });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValue(member);
    prismaMock.group.findUnique.mockResolvedValue({ name: "Équipe A", billingMode: "GROUP", users: [admin] });
  });

  it("accepter : rejoint l'équipe, annule les autres invitations et prévient l'admin et le membre", async () => {
    await expect(
      respondToGroupInvitationAction({ invitationId: INVITATION_ID, accept: true }),
    ).resolves.toEqual({ ok: true });
    await flush();

    const [first, second] = prismaMock.groupInvitation.updateMany.mock.calls.map((c) => c[0]);
    expect(first.where).toEqual({
      id: INVITATION_ID,
      userId: "u1",
      status: "PENDING",
      expiresAt: { gt: expect.any(Date) },
    });
    expect(first.data).toMatchObject({ status: "ACCEPTED" });

    const join = prismaMock.user.updateMany.mock.calls[0][0];
    expect(join.where).toEqual({ id: "u1", groupId: null, groupStatus: "PENDING", role: "user" });
    expect(join.data).toMatchObject({ groupId: "g1", groupStatus: "JOINED" });
    expect(join.data.joinedAt).toBeInstanceOf(Date);

    expect(second.where).toEqual({ userId: "u1", status: "PENDING", id: { not: INVITATION_ID } });
    expect(second.data).toMatchObject({ status: "CANCELLED" });

    expect(invitationEmails.sendInvitationResponseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ admin, groupName: "Équipe A", accepted: true }),
    );
    expect(notifyAccountTypeChanges).toHaveBeenCalledWith([
      expect.objectContaining({ email: "ana@example.com", to: "member", groupName: "Équipe A", billingMode: "GROUP" }),
    ]);
  });

  it("refuser : le compte reste en attente et l'admin est prévenu", async () => {
    await expect(
      respondToGroupInvitationAction({ invitationId: INVITATION_ID, accept: false }),
    ).resolves.toEqual({ ok: true });
    await flush();

    expect(prismaMock.groupInvitation.updateMany.mock.calls[0][0].data).toMatchObject({ status: "DECLINED" });
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    expect(invitationEmails.sendInvitationResponseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: false }),
    );
    expect(notifyAccountTypeChanges).not.toHaveBeenCalled();
  });

  it("refuse une invitation expirée, annulée, déjà traitée ou d'un autre compte", async () => {
    prismaMock.groupInvitation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      respondToGroupInvitationAction({ invitationId: INVITATION_ID, accept: true }),
    ).resolves.toEqual({ ok: false, error: "invitationUnavailable" });
    await flush();

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    expect(invitationEmails.sendInvitationResponseEmail).not.toHaveBeenCalled();
  });

  it("refuse d'accepter si le compte n'est plus en attente sans équipe", async () => {
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      respondToGroupInvitationAction({ invitationId: INVITATION_ID, accept: true }),
    ).resolves.toEqual({ ok: false, error: "invitationUnavailable" });
    await flush();

    expect(invitationEmails.sendInvitationResponseEmail).not.toHaveBeenCalled();
    expect(notifyAccountTypeChanges).not.toHaveBeenCalled();
  });
});

describe("cancelGroupInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin", role: "groupAdmin" } });
    prismaMock.user.findUnique.mockResolvedValue({ role: "groupAdmin", groupId: "g1" });
  });

  it("n'annule qu'une invitation en attente de sa propre équipe", async () => {
    prismaMock.groupInvitation.updateMany.mockResolvedValue({ count: 1 });

    await expect(cancelGroupInvitationAction(INVITATION_ID)).resolves.toMatchObject({ ok: true });

    const call = prismaMock.groupInvitation.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: INVITATION_ID, groupId: "g1", status: "PENDING" });
    expect(call.data).toMatchObject({ status: "CANCELLED" });
  });

  it("renvoie invitationUnavailable si rien n'a été annulé", async () => {
    prismaMock.groupInvitation.updateMany.mockResolvedValue({ count: 0 });

    await expect(cancelGroupInvitationAction(INVITATION_ID)).resolves.toEqual({
      ok: false,
      error: "invitationUnavailable",
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

  it("prévient chaque membre du passage en forfait individuel", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: "g1", name: "Équipe A" });
    prismaMock.user.findMany.mockResolvedValue([{ email: "ana@example.com", firstName: "Ana" }]);

    await deleteGroupAction("g1");

    expect(notifyAccountTypeChanges).toHaveBeenCalledWith([
      expect.objectContaining({ email: "ana@example.com", to: "solo", groupName: "Équipe A", groupDeleted: true }),
    ]);
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
