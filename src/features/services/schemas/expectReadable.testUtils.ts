import { expect } from 'vitest';
import type * as z from 'zod';
import type { ServiceType } from '@prisma/client';
import { parseServiceDetails } from './serviceDetails.schema';

/** Formulaire valide → domaine → stockage JSON → relecture identique */
export function expectReadable(type: ServiceType, formSchema: z.ZodType, values: unknown) {
  const form = formSchema.safeParse(values);
  expect(form.success, JSON.stringify(form.error?.issues)).toBe(true);

  const stored: unknown = JSON.parse(JSON.stringify(form.data));
  const parsed = parseServiceDetails(type, stored);

  expect(parsed).not.toBeNull();
  // Le grand format réinjecte `type` dans ses détails
  expect(parsed?.details).toEqual(parsed?.kind === 'largeFormat' ? { ...(stored as object), type } : stored);
}