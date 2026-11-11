import * as z from 'zod';
import {
  EXCLUSIVE_REMOVAL_MATERIALS, IMPLEMENTED_REMOVAL_MATERIALS, MAX_REMOVAL_ADDONS, MAX_REMOVAL_DIRECTIONALS,
  MAX_REMOVAL_FLAGS, MAX_REMOVAL_FRAMES, MAX_REMOVAL_KEYBOXES, REMOVAL_TEXT_LIMITS,
  type ImplementedRemovalMaterial, type RemovalMaterial,
} from '../constants/removal';
import { FLAG_MENTIONS, SIGN_MENTIONS, TEXT_LIMITS } from '../constants/installation';
import type { RemovalDetails, RemovalUnit } from '../types/removal';
import {
  createDefaultPlacement, fromPlacement, placementFormSchema, toPlacement, validatePlacement,
} from './placement.schema';
import { defined, keyboxCode, text, type Path, type Report } from './shared';
import { issueMessage } from '@/shared/utils/issueMessage';

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
    // Mêmes mentions qu'à l'installation
    mention: z.enum(FLAG_MENTIONS).nullable(),
    customMention: text(TEXT_LIMITS.flagMention),
    quantity: quantity(MAX_REMOVAL_FLAGS, 'drapeaux'),
    placement: text(REMOVAL_TEXT_LIMITS.flagsPlacement),
  }),
  directionals: z.object({
    mention: z.enum(SIGN_MENTIONS).nullable(),
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

    if (v.materials.length === 0) report(['materials'], 'selectRemovalItem');

    for (const [a, b] of EXCLUSIVE_REMOVAL_MATERIALS) {
      if (selected.includes(a) && selected.includes(b)) {
        report(['materials'], issueMessage('incompatibleRemoval', { a, b }));
      }
    }

    if (has('frames')) validateUnits(v.frames.units, ['frames', 'units'], 'framesRequired', report);
    if (has('addons')) validateUnits(v.addons.units, ['addons', 'units'], 'addonsUnitsRequired', report);
    if (has('keybox') && !v.keybox.code) report(['keybox', 'code'], 'removalKeyboxCodeRequired');
    if (has('flags')) {
      if (v.flags.mention === null) report(['flags', 'mention'], 'chooseFlagMention');
      else if (v.flags.mention === 'other' && !v.flags.customMention) {
        report(['flags', 'customMention'], 'flagMentionRequired');
      }
    }
    if (has('directional')) {
      if (v.directionals.mention === null) report(['directionals', 'mention'], 'chooseDirectionalMention');
      if (v.directionals.units.length === 0) report(['directionals', 'units'], 'directionalsRequired');
    }
    if (has('other') && !v.otherDetails) report(['otherDetails'], 'removalDetailsRequired');
  })
  .transform((v: FormOutput): RemovalDetails => ({
    frames: v.materials.includes('frames') ? { units: v.frames.units.map(toUnit) } : null,
    addons: v.materials.includes('addons')
      ? { units: v.addons.units.map(toUnit), details: v.addons.details || null }
      : null,
    keybox: v.materials.includes('keybox') ? { ...v.keybox } : null,
    flags: v.materials.includes('flags') ? toFlags(v.flags) : null,
    directionals: v.materials.includes('directional')
      ? {
          mention: defined(v.directionals.mention),
          units: v.directionals.units.map((u) => ({ uid: u.uid, placement: u.placement })),
        }
      : null,
    otherDetails: v.materials.includes('other') ? v.otherDetails : null,
  }));

const toUnit = (u: UnitOutput): RemovalUnit => ({ uid: u.uid, placement: toPlacement(u.placement) });

function toFlags(f: FormOutput['flags']): NonNullable<RemovalDetails['flags']> {
  const mention = defined(f.mention);
  const base = { quantity: f.quantity, placement: f.placement };
  return mention === 'other' ? { ...base, mention, customMention: f.customMention } : { ...base, mention };
}

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
  flags: { mention: null, customMention: '', quantity: 1, placement: '' },
  directionals: { mention: null, units: [] },
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
    flags: details.flags
      ? {
          // Retraits enregistrés avant la question de la mention : à choisir à nouveau
          mention: details.flags.mention ?? null,
          customMention: details.flags.mention === 'other' ? details.flags.customMention : '',
          quantity: details.flags.quantity,
          placement: details.flags.placement,
        }
      : empty.flags,
    directionals: details.directionals
      ? { mention: details.directionals.mention ?? null, units: details.directionals.units.map((u) => ({ ...u })) }
      : empty.directionals,
    otherDetails: details.otherDetails ?? '',
  };
}