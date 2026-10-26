import { z } from 'zod';

export const REQUIRED = 'Ce champ est requis';
export const tooLong = (max: number) => `Maximum ${max} caractères`;
export const text = (max: number) => z.string().trim().max(max, tooLong(max));

export type Path = (string | number)[];
export type Report = (path: Path, message: string) => void;

/** Invariant : appelée uniquement après un superRefine réussi. */
export function defined<T>(value: T | null): T {
  if (value === null) throw new Error('Invariant violé : valeur non validée');
  return value;
}