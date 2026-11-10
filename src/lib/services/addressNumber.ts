export const ADDRESS_NUMBER_PREFIX = 'PE-';
const MAX_INT = 2_147_483_647; // plafond de la colonne Int

export function formatAddressNumber(addressNumber: number): string {
  return `${ADDRESS_NUMBER_PREFIX}${addressNumber}`;
}

/** Accepte « PE-11191 », « pe11191 » ou « 11191 » ; null si invalide */
export function parseAddressNumber(input: string): number | null {
  const match = /^\s*(?:PE-?)?(\d{1,10})\s*$/i.exec(input);
  if (!match) return null;
  const n = Number(match[1]);
  return n <= MAX_INT ? n : null;
}