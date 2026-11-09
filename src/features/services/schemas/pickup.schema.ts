import * as z from 'zod';
import { PICKUP_MATERIALS, PICKUP_TEXT_LIMITS, type PickupMaterial } from '../constants/pickup';
import type { PickupDetails } from '../types/pickup';
import { REQUIRED, defined, text, type Report } from './shared';

const pickupFormSchema = z.object({
  materials: z.array(z.enum(PICKUP_MATERIALS)),
  newModels: z.boolean().nullable(),
  details: text(PICKUP_TEXT_LIMITS.details),
});

/** Les détails deviennent obligatoires dès qu'il faut savoir quoi ramasser ou ce qui change */
export const isPickupDetailsRequired = (v: { materials: readonly PickupMaterial[]; newModels: boolean | null }) =>
  v.materials.includes('other') || v.newModels === true;

export const pickupSchema = pickupFormSchema
  .superRefine((v, ctx) => {
    const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
    if (v.materials.length === 0) report(['materials'], 'selectPickupItem');
    if (v.newModels === null) report(['newModels'], REQUIRED);
    if (isPickupDetailsRequired(v) && !v.details) {
      report(['details'], v.materials.includes('other')
        ? 'describePickupMaterial'
        : 'describeNewModels');
    }
  })
  .transform((v): PickupDetails => ({
    // Ordre de la liste, sans doublon, quel que soit l'ordre des clics
    materials: PICKUP_MATERIALS.filter((m) => v.materials.includes(m)),
    newModels: defined(v.newModels),
    details: v.details || null,
  }));

export type PickupFormValues = z.input<typeof pickupSchema>;

export const createEmptyPickupForm = (): PickupFormValues => ({ materials: [], newModels: false, details: '' });

export const toPickupFormValues = (d: PickupDetails): PickupFormValues => ({
  materials: [...d.materials],
  newModels: d.newModels,
  details: d.details ?? '',
});