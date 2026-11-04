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

  it('ignore un code absent ou inconnu', () => {
    expect(getLoginErrorKey(null)).toBeNull();
    expect(getLoginErrorKey('')).toBeNull();
    expect(getLoginErrorKey('inconnu')).toBeNull();
  });

  it("ignore les propriétés héritées d'Object, que l'URL permet de demander", () => {
    expect(getLoginErrorKey('constructor')).toBeNull();
    expect(getLoginErrorKey('toString')).toBeNull();
    expect(getLoginErrorKey('__proto__')).toBeNull();
  });
});
