import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Anti-énumération : forgot-password et verify-reset-code doivent répondre à l'identique,
// que le compte existe ou non, et quel que soit l'échec interne (SMTP, base).

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  verificationToken: { findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
const emailMock = vi.hoisted(() => ({
  sendAccountCreatedEmails: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

// after() exige un contexte de requête Next : on met les tâches en file pour les exécuter à la main
const afterQueue = vi.hoisted(() => [] as Array<() => unknown>);
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => unknown) => {
    afterQueue.push(task);
  },
}));

async function flushAfter() {
  while (afterQueue.length) await afterQueue.shift()?.();
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/server/password", () => ({ hashPassword: vi.fn(), bcryptCompare: vi.fn() }));
vi.mock("@/lib/auth/server/authEmails", () => emailMock);

const { POST: forgotPassword } = await import("./forgot-password/route");
const { POST: verifyResetCode } = await import("./verify-reset-code/route");

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function snapshot(res: Response) {
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.clearAllMocks();
  afterQueue.length = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
  prismaMock.$transaction.mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/custom/forgot-password", () => {
  const body = { email: "ana@example.com", locale: "fr" };
  const SUCCESS = { status: 200, body: { success: true, message: "Reset email sent" } };

  it("même réponse : compte inexistant, compte existant, superAdmin, échec SMTP, échec base", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const missing = await snapshot(await forgotPassword(jsonRequest(body)));
    await flushAfter();

    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "user" });
    const existing = await snapshot(await forgotPassword(jsonRequest(body)));
    await flushAfter();

    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "superAdmin" });
    const superAdmin = await snapshot(await forgotPassword(jsonRequest(body)));
    await flushAfter();

    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "user" });
    emailMock.sendPasswordResetEmail.mockRejectedValueOnce(new Error("Invalid login: 535 Authentication failed"));
    const smtpDown = await snapshot(await forgotPassword(jsonRequest(body)));
    await flushAfter();

    prismaMock.user.findUnique.mockRejectedValueOnce(new Error("connexion Neon perdue"));
    const dbDown = await snapshot(await forgotPassword(jsonRequest(body)));
    await flushAfter();

    for (const res of [missing, existing, superAdmin, smtpDown, dbDown]) {
      expect(res).toEqual(SUCCESS);
    }
    expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledTimes(2);
  });

  it("répond avant toute lecture de la base ou envoi SMTP (temps de réponse indépendant du compte)", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "user" });
    emailMock.sendPasswordResetEmail.mockReturnValueOnce(new Promise(() => {}));

    await expect(snapshot(await forgotPassword(jsonRequest(body)))).resolves.toEqual(SUCCESS);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(afterQueue).toHaveLength(1);
  });

  it("requête invalide → validationFailed ou invalidJson, sans consulter la base", async () => {
    await expect(snapshot(await forgotPassword(jsonRequest({ email: "pas-un-courriel" })))).resolves.toEqual({
      status: 400,
      body: { error: "validationFailed" },
    });

    const broken = new Request("http://localhost/api", { method: "POST", body: "{pas du json" });
    await expect(snapshot(await forgotPassword(broken))).resolves.toEqual({ status: 400, body: { error: "invalidJson" } });

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/custom/verify-reset-code", () => {
  const body = { email: "ana@example.com", code: "999999" };
  const INVALID = { status: 400, body: { error: "invalidCode" } };
  const future = () => new Date(Date.now() + 60_000);

  it("même réponse : compte inexistant, code faux, code expiré, trop de tentatives", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValueOnce(null);
    const missing = await snapshot(await verifyResetCode(jsonRequest(body)));

    prismaMock.verificationToken.findFirst.mockResolvedValueOnce({ id: "t1", token: "123456", expires: future() });
    prismaMock.verificationToken.updateMany.mockResolvedValueOnce({ count: 1 });
    const wrong = await snapshot(await verifyResetCode(jsonRequest(body)));

    prismaMock.verificationToken.findFirst.mockResolvedValueOnce({
      id: "t1",
      token: "999999",
      expires: new Date(Date.now() - 60_000),
    });
    const expired = await snapshot(await verifyResetCode(jsonRequest(body)));

    prismaMock.verificationToken.findFirst.mockResolvedValueOnce({ id: "t1", token: "123456", expires: future() });
    prismaMock.verificationToken.updateMany.mockResolvedValueOnce({ count: 0 });
    const locked = await snapshot(await verifyResetCode(jsonRequest(body)));

    for (const res of [missing, wrong, expired, locked]) {
      expect(res).toEqual(INVALID);
    }
  });

  it("code valide → succès", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValueOnce({ id: "t1", token: "999999", expires: future() });
    prismaMock.verificationToken.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(snapshot(await verifyResetCode(jsonRequest(body)))).resolves.toEqual({
      status: 200,
      body: { success: true },
    });
  });
});
