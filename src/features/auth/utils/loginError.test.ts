import { describe, expect, it } from 'vitest';
import en from '../../../../messages/en/login.json';
import fr from '../../../../messages/fr/login.json';
import { getLoginErrorKey } from './loginError';

const CODES = [
  'no_account',
  'account_exists',
  'AccessDenied',
  'CredentialsSignin',
  'OAuthCallbackError',
  'OAuthAccountNotLinked',
  'AccountNotLinked',
  'Configuration',
  'Verification',
  'MissingCSRF',
];

describe('getLoginErrorKey', () => {
  it.each(CODES)('traduit %s en français et en anglais', (code) => {
    const key = getLoginErrorKey(code);

    expect(key).not.toBeNull();
    expect(fr[key!]).toEqual(expect.any(String));
    expect(en[key!]).toEqual(expect.any(String));
  });

  it('aucun code → aucun message', () => {
    expect(getLoginErrorKey(null)).toBeNull();
    expect(getLoginErrorKey('')).toBeNull();
  });

  it('code inconnu → message générique (jamais le texte de l’URL)', () => {
    expect(getLoginErrorKey('inconnu')).toBe('errorGeneric');
    expect(getLoginErrorKey('OAuthSignin')).toBe('errorGeneric');
  });

  it("ignore les propriétés héritées d'Object, que l'URL permet de demander", () => {
    // Message générique, et non la fonction héritée : hasOwn empêche de remonter au prototype
    expect(getLoginErrorKey('constructor')).toBe('errorGeneric');
    expect(getLoginErrorKey('toString')).toBe('errorGeneric');
    expect(getLoginErrorKey('__proto__')).toBe('errorGeneric');
  });
});
