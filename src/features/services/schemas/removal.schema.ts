import { z } from 'zod';
import {
  IMPLEMENTED_REMOVAL_MATERIALS, MAX_REMOVAL_FRAMES, type ImplementedRemovalMaterial,
} from '../constants/removal';
import type { RemovalDetails, RemovalFrameUnit } from '../types/removal';
import {
  createEmptyPlacement, fromPlacement, placementFormSchema, toPlacement, validatePlacement,
} from './placement.schema';
import type { Report } from './shared';

/* ---------- Forme du formulaire ---------- */

const removalFrameUnitFormSchema = z.object({
  uid: z.string().min(1),
  placement: placementFormSchema,
});

const removalFormSchema = z.object({
  materials: z.array(z.enum(IMPLEMENTED_REMOVAL_MATERIALS)),
  frames: z.object({
    units: z.array(removalFrameUnitFormSchema).max(MAX_REMOVAL_FRAMES, `Maximum ${MAX_REMOVAL_FRAMES} pancartes`),
  }),
});

type FormOutput = z.output<typeof removalFormSchema>;
type FrameUnitOutput = z.output<typeof removalFrameUnitFormSchema>;

/* ---------- Schéma public ---------- */

export const removalSchema = removalFormSchema
  .superRefine((v, ctx) => {
    const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
    const has = (m: ImplementedRemovalMaterial) => v.materials.includes(m);

    if (v.materials.length === 0) report(['materials'], 'Sélectionnez au moins un élément à retirer');

    if (has('frames')) {
      if (v.frames.units.length === 0) report(['frames', 'units'], 'Indiquez au moins une pancarte');
      // Un emplacement par pancarte, validé indépendamment
      v.frames.units.forEach((u, i) => validatePlacement(u.placement, ['frames', 'units', i, 'placement'], report));
    }
  })
  .transform((v: FormOutput): RemovalDetails => ({
    frames: v.materials.includes('frames') ? { units: v.frames.units.map(toFrameUnit) } : null,
  }));

const toFrameUnit = (u: FrameUnitOutput): RemovalFrameUnit => ({ uid: u.uid, placement: toPlacement(u.placement) });

/* ---------- Types et valeurs initiales ---------- */

export type RemovalSchema = typeof removalSchema;
export type RemovalFormValues = z.input<RemovalSchema>;
export type RemovalFrameUnitFormValues = z.input<typeof removalFrameUnitFormSchema>;

export const createRemovalFrameUnit = (): RemovalFrameUnitFormValues => ({
  uid: crypto.randomUUID(),
  placement: createEmptyPlacement(),
});

export const createEmptyRemovalForm = (): RemovalFormValues => ({
  materials: [],
  frames: { units: [] },
});

/* ---------- Domaine → formulaire ---------- */

export function toRemovalFormValues(details: RemovalDetails): RemovalFormValues {
  const materials: ImplementedRemovalMaterial[] = [];
  if (details.frames) materials.push('frames');

  return {
    materials,
    frames: details.frames
      ? { units: details.frames.units.map((u) => ({ uid: u.uid, placement: fromPlacement(u.placement) })) }
      : { units: [] },
  };
}