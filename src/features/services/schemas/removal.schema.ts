import { z } from 'zod';
import {
  EXCLUSIVE_REMOVAL_MATERIALS, IMPLEMENTED_REMOVAL_MATERIALS, MAX_REMOVAL_ADDONS, MAX_REMOVAL_DIRECTIONALS,
  MAX_REMOVAL_FLAGS, MAX_REMOVAL_FRAMES, MAX_REMOVAL_KEYBOXES, REMOVAL_MATERIAL_LABELS, REMOVAL_TEXT_LIMITS,
  type ImplementedRemovalMaterial, type RemovalMaterial,
} from '../constants/removal';
import type { RemovalDetails, RemovalUnit } from '../types/removal';
import {
  createDefaultPlacement, fromPlacement, placementFormSchema, toPlacement, validatePlacement,
} from './placement.schema';
import { keyboxCode, text, type Path, type Report } from './shared';

/* ---------- Forme du formulaire ---------- */

const quantity = (max: number, unit: string) => z.number().int().min(1, 'Minimum 1').max(max, `Maximum ${max} ${unit}`);

const removalUnitFormSchema = z.object({
  uid: z.string().min(1),
  placement: placementFormSchema,
});

const removalFormSchema = z.object({
  materials: z.array(z.enum(IMPLEMENTED_REMOVAL_MATERIALS)),
  frames: z.object({
    units: z.array(removalUnitFormSchema).max(MAX_REMOVAL_FRAMES, `Maximum ${MAX_REMOVAL_FRAMES} pancartes`),
  }),
  addons: z.object({
    units: z.array(removalUnitFormSchema).max(MAX_REMOVAL_ADDONS, `Maximum ${MAX_REMOVAL_ADDONS} ajouts`),
    details: text(REMOVAL_TEXT_LIMITS.addonsDetails),
  }),
  keybox: z.object({
    quantity: quantity(MAX_REMOVAL_KEYBOXES, 'boîtes'),
    code: keyboxCode(),
    placement: text(REMOVAL_TEXT_LIMITS.keyboxPlacement),
  }),
  flags: z.object({
    quantity: quantity(MAX_REMOVAL_FLAGS, 'drapeaux'),
    placement: text(REMOVAL_TEXT_LIMITS.flagsPlacement),
  }),
  directionals: z.object({
    units: z
      .array(z.object({ uid: z.string().min(1), placement: text(REMOVAL_TEXT_LIMITS.directionalPlacement) }))
      .max(MAX_REMOVAL_DIRECTIONALS, `Maximum ${MAX_REMOVAL_DIRECTIONALS} directionnelles`),
  }),
  otherDetails: text(REMOVAL_TEXT_LIMITS.otherDetails),
});

type FormOutput = z.output<typeof removalFormSchema>;
type UnitOutput = z.output<typeof removalUnitFormSchema>;

/* ---------- Validation ---------- */

function validateUnits(units: UnitOutput[], path: Path, emptyMessage: string, report: Report) {
  if (units.length === 0) report(path, emptyMessage);
  // Un emplacement par unité, validé indépendamment
  units.forEach((u, i) => validatePlacement(u.placement, [...path, i, 'placement'], report));
}

/* ---------- Schéma public ---------- */

export const removalSchema = removalFormSchema
  .superRefine((v, ctx) => {
    const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
    const selected: readonly RemovalMaterial[] = v.materials;
    const has = (m: ImplementedRemovalMaterial) => v.materials.includes(m);

    if (v.materials.length === 0) report(['materials'], 'Sélectionnez au moins un élément à retirer');

    for (const [a, b] of EXCLUSIVE_REMOVAL_MATERIALS) {
      if (selected.includes(a) && selected.includes(b)) {
        report(['materials'], `« ${REMOVAL_MATERIAL_LABELS[a]} » et « ${REMOVAL_MATERIAL_LABELS[b]} » ne peuvent pas être retirés ensemble`);
      }
    }

    if (has('frames')) validateUnits(v.frames.units, ['frames', 'units'], 'Indiquez au moins une pancarte', report);
    if (has('addons')) validateUnits(v.addons.units, ['addons', 'units'], 'Indiquez au moins un ajout', report);
    if (has('keybox') && !v.keybox.code) report(['keybox', 'code'], 'Indiquez le code des boîtes à clés');
    if (has('directional') && v.directionals.units.length === 0) {
      report(['directionals', 'units'], 'Indiquez au moins une directionnelle');
    }
    if (has('other') && !v.otherDetails) report(['otherDetails'], 'Indiquez les détails du retrait');
  })
  .transform((v: FormOutput): RemovalDetails => ({
    frames: v.materials.includes('frames') ? { units: v.frames.units.map(toUnit) } : null,
    addons: v.materials.includes('addons')
      ? { units: v.addons.units.map(toUnit), details: v.addons.details || null }
      : null,
    keybox: v.materials.includes('keybox') ? { ...v.keybox } : null,
    flags: v.materials.includes('flags') ? { ...v.flags } : null,
    directionals: v.materials.includes('directional')
      ? { units: v.directionals.units.map((u) => ({ uid: u.uid, placement: u.placement })) }
      : null,
    otherDetails: v.materials.includes('other') ? v.otherDetails : null,
  }));

const toUnit = (u: UnitOutput): RemovalUnit => ({ uid: u.uid, placement: toPlacement(u.placement) });

/* ---------- Types et valeurs initiales ---------- */

export type RemovalSchema = typeof removalSchema;
export type RemovalFormValues = z.input<RemovalSchema>;
export type RemovalUnitFormValues = z.input<typeof removalUnitFormSchema>;

export const createRemovalDirectional = () => ({ uid: crypto.randomUUID(), placement: '' });

export const createRemovalUnit = (): RemovalUnitFormValues => ({
  uid: crypto.randomUUID(),
  placement: createDefaultPlacement(),
});

export const createEmptyRemovalForm = (): RemovalFormValues => ({
  materials: [],
  frames: { units: [] },
  addons: { units: [], details: '' },
  keybox: { quantity: 1, code: '', placement: '' },
  flags: { quantity: 1, placement: '' },
  directionals: { units: [] },
  otherDetails: '',
});

/* ---------- Domaine → formulaire ---------- */

const fromUnit = (u: RemovalUnit): RemovalUnitFormValues => ({ uid: u.uid, placement: fromPlacement(u.placement) });

export function toRemovalFormValues(details: RemovalDetails): RemovalFormValues {
  const empty = createEmptyRemovalForm();

  // Les retraits enregistrés avant l'ajout d'un matériel n'ont pas son champ : undefined = non sélectionné
  const materials: ImplementedRemovalMaterial[] = [];
  if (details.frames) materials.push('frames');
  if (details.addons) materials.push('addons');
  if (details.keybox) materials.push('keybox');
  if (details.flags) materials.push('flags');
  if (details.directionals) materials.push('directional');
  if (details.otherDetails) materials.push('other');

  return {
    materials,
    frames: details.frames ? { units: details.frames.units.map(fromUnit) } : empty.frames,
    addons: details.addons
      ? { units: details.addons.units.map(fromUnit), details: details.addons.details ?? '' }
      : empty.addons,
    keybox: details.keybox ? { ...details.keybox } : empty.keybox,
    flags: details.flags ? { ...details.flags } : empty.flags,
    directionals: details.directionals
      ? { units: details.directionals.units.map((u) => ({ ...u })) }
      : empty.directionals,
    otherDetails: details.otherDetails ?? '',
  };
}