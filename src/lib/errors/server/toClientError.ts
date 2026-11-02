import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, APP_ERROR_STATUS, type ClientError } from "../appError";

type ToClientErrorOptions = {
  /** Ajoute `fields` (noms des champs invalides) : seulement si un formulaire s'en sert */
  withFields?: boolean;
};

/**
 * Convertit n'importe quelle erreur en réponse sûre pour le client.
 * Erreur métier → son code ; validation → validationFailed ; JSON illisible → invalidJson ;
 * tout le reste → serverError, l'erreur complète n'étant journalisée que côté serveur.
 */
export function toClientError(
  err: unknown,
  context: string,
  options: ToClientErrorOptions = {},
): { status: number; body: ClientError } {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.code } };
  }

  if (err instanceof ZodError) {
    const body: ClientError = { error: "validationFailed" };
    if (options.withFields) {
      body.fields = [...new Set(err.issues.map((issue) => issue.path.join(".")))];
    }
    return { status: APP_ERROR_STATUS.validationFailed, body };
  }

  // request.json() sur un corps illisible
  if (err instanceof SyntaxError) {
    return { status: APP_ERROR_STATUS.invalidJson, body: { error: "invalidJson" } };
  }

  console.error(`[${context}]`, err);
  return { status: APP_ERROR_STATUS.serverError, body: { error: "serverError" } };
}

export function errorResponse(err: unknown, context: string, options?: ToClientErrorOptions) {
  const { status, body } = toClientError(err, context, options);
  return NextResponse.json(body, { status });
}
