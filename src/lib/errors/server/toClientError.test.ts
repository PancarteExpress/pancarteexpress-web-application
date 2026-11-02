import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));

const { toClientError, errorResponse } = await import("./toClientError");
const { AppError, isAppErrorCode, readErrorCode } = await import("../appError");

const schema = z.object({
  email: z.string().email("Courriel invalide"),
  address: z.object({ city: z.string().min(2, "Ville trop courte") }),
});

function zodError(input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error("le schéma devait échouer");
  return parsed.error;
}

describe("toClientError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("AppError → son code et son statut, sans journalisation", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(toClientError(new AppError("userExists"), "test")).toEqual({ status: 409, body: { error: "userExists" } });
    expect(toClientError(new AppError("emailSendFailed"), "test")).toEqual({
      status: 502,
      body: { error: "emailSendFailed" },
    });
    expect(log).not.toHaveBeenCalled();
  });

  it("ZodError → validationFailed, sans fields par défaut", () => {
    expect(toClientError(zodError({ email: "x", address: { city: "" } }), "test")).toEqual({
      status: 400,
      body: { error: "validationFailed" },
    });
  });

  it("ZodError avec withFields → noms de champs seulement, jamais de message ni de code Zod", () => {
    const { body } = toClientError(zodError({ email: "x", address: { city: "" } }), "test", { withFields: true });

    expect(body).toEqual({ error: "validationFailed", fields: ["email", "address.city"] });
    const json = JSON.stringify(body);
    expect(json).not.toContain("Courriel invalide");
    expect(json).not.toContain("Ville trop courte");
    expect(json).not.toContain("too_small");
  });

  it("SyntaxError (JSON illisible) → invalidJson", () => {
    let err: unknown;
    try {
      JSON.parse("{pas du json");
    } catch (e) {
      err = e;
    }
    expect(toClientError(err, "test")).toEqual({ status: 400, body: { error: "invalidJson" } });
  });

  it("erreur inconnue → serverError générique, erreur complète journalisée côté serveur", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const smtp = new Error("Invalid login: 535 Authentication failed");

    const result = toClientError(smtp, "register");

    expect(result).toEqual({ status: 500, body: { error: "serverError" } });
    expect(JSON.stringify(result.body)).not.toContain("535");
    expect(log).toHaveBeenCalledWith("[register]", smtp);
  });

  it("erreur Prisma → serverError, aucun détail de requête renvoyé", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`email`)", {
      code: "P2002",
      clientVersion: "test",
    });

    expect(toClientError(prismaError, "test").body).toEqual({ error: "serverError" });
  });

  it("errorResponse → NextResponse avec le même statut et le même corps", async () => {
    const res = errorResponse(new AppError("invalidCode"), "test");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalidCode" });
  });
});

describe("readErrorCode / isAppErrorCode", () => {
  it("renvoie le code connu de la réponse", async () => {
    await expect(readErrorCode(Response.json({ error: "invalidCode" }, { status: 400 }))).resolves.toBe("invalidCode");
  });

  it("replie sur serverError pour un message brut ou un corps illisible", async () => {
    await expect(readErrorCode(Response.json({ error: "Invalid login: 535" }, { status: 400 }))).resolves.toBe(
      "serverError",
    );
    await expect(readErrorCode(new Response("<html>", { status: 502 }))).resolves.toBe("serverError");
  });

  it("refuse les clés héritées de Object.prototype", () => {
    expect(isAppErrorCode("toString")).toBe(false);
    expect(isAppErrorCode("userExists")).toBe(true);
  });
});
