// Codes de ?error= : les nôtres (callback signIn) et ceux qu'Auth.js envoie vers pages.signIn et pages.error
const LOGIN_ERROR_KEYS = {
  no_account: 'errorNoAccount',
  account_exists: 'errorAccountExists',
  AccessDenied: 'errorAccessDenied',
  CredentialsSignin: 'errorInvalidCredentials',
  OAuthCallbackError: 'errorGoogle',
  OAuthAccountNotLinked: 'errorAccountExists',
  AccountNotLinked: 'errorAccountExists',
  Configuration: 'errorGeneric',
  Verification: 'errorGeneric',
  MissingCSRF: 'errorGeneric',
} as const;

export type LoginErrorKey = (typeof LOGIN_ERROR_KEYS)[keyof typeof LOGIN_ERROR_KEYS];

/** @returns la clé i18n du namespace "login", ou null si le code est absent ou inconnu */
export function getLoginErrorKey(error: string | null): LoginErrorKey | null {
  if (!error || !Object.hasOwn(LOGIN_ERROR_KEYS, error)) return null;
  return LOGIN_ERROR_KEYS[error as keyof typeof LOGIN_ERROR_KEYS];
}
