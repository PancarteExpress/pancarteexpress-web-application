import * as z from 'zod';
import { KEYBOX_CODE_MAX_DIGITS } from '../constants/installation';
import { issueMessage } from '@/shared/utils/issueMessage';

// Messages d'erreur : clés i18n du namespace services.errors, traduites à l'affichage
export const REQUIRED = 'required';
export const tooLong = (max: number) => issueMessage('tooLong', { max });
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
  z.string().trim().regex(KEYBOX_CODE_REGEX, issueMessage('keyboxCodeFormat', { max: KEYBOX_CODE_MAX_DIGITS }));