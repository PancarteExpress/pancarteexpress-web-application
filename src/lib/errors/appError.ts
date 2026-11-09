// Contrat d'erreur partagé client/serveur : le serveur ne renvoie qu'un code,
// le client le traduit (namespace i18n "errors", clé = code).

export const APP_ERROR_STATUS = {
  unauthorized: 401,
  invalidCredentials: 401,
  userExists: 409,
  userNotFound: 404,
  noPassword: 400,
  currentPasswordIncorrect: 400,
  emailChangeNotAllowed: 403,
  usernameTaken: 409,
  invalidCode: 400,
  tooManyAttempts: 429,
  validationFailed: 400,
  invalidJson: 400,
  emailSendFailed: 502,
  serverError: 500,
} as const satisfies Record<string, number>;

export type AppErrorCode = keyof typeof APP_ERROR_STATUS;

/** Corps JSON de toute réponse d'erreur. `fields` : noms des champs en erreur, jamais de message Zod. */
export type ClientError = { error: AppErrorCode; fields?: string[] };

/** Erreur métier connue : seul son code part au client. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode) {
    super(code);
    this.name = "AppError";
    this.code = code;
    this.status = APP_ERROR_STATUS[code];
  }
}

export function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(APP_ERROR_STATUS, value);
}

/** Côté client : extrait le code d'une réponse en erreur, "serverError" par défaut. */
export async function readErrorCode(res: Response): Promise<AppErrorCode> {
  const body: unknown = await res.json().catch(() => null);
  const code = typeof body === "object" && body !== null && "error" in body ? body.error : null;
  return isAppErrorCode(code) ? code : "serverError";
}
