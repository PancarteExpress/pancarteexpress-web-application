import { z } from 'zod';
import { KEYBOX_CODE_MAX_DIGITS } from '../constants/installation';

export const REQUIRED = 'Ce champ est requis';
export const tooLong = (max: number) => `Maximum ${max} caractères`;
export const text = (max: number) => z.string().trim().max(max, tooLong(max));

export type Path = (string | number)[];
export type Report = (path: Path, message: string) => void;

const KEYBOX_CODE_REGEX = new RegExp(`^\\d{0,${KEYBOX_CODE_MAX_DIGITS}}$`);

/** Invariant : appelée uniquement après un superRefine réussi. */
export function defined<T>(value: T | null): T {
  if (value === null) throw new Error('Invariant violé : valeur non validée');
  return value;
}

/** Code de boîte à clés : chiffres seulement, longueur maximale partagée */
export const keyboxCode = () =>
  z.string().trim().regex(KEYBOX_CODE_REGEX, `Code de ${KEYBOX_CODE_MAX_DIGITS} chiffres maximum`);