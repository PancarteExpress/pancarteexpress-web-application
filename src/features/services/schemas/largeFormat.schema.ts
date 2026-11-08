import * as z from 'zod';
import {
  ACQUISITIONS, EASEL_STYLES, LARGE_ACCESS, LARGE_LOCATIONS, LARGE_TEXT_LIMITS, STORAGE_PICKUP_MATERIALS,
  STRUCTURES, WOOD_FRAMD_STYLES, type Structure,
} from '../constants/largeFormat';
import type {
  LargeInstallationDetails, LargeRetrievalDetails, LargeStoragePickupDetails, StructureChoice,
} from '../types/largeFormat';
import { REQUIRED, defined, text, type Report } from './shared';

const reporter = (ctx: z.RefinementCtx): Report => (path, message) => ctx.addIssue({ code: 'custom', path, message });

/* ==========================================================================
   Emplacement (installation et récupération)
   ========================================================================== */

const placementShape = {
  location: z.enum(LARGE_LOCATIONS).nullable(),
  access: z.enum(LARGE_ACCESS).nullable(),
};

function validatePlacement(v: { location: string | null; access: string | null }, report: Report) {
  if (v.location === null) report(['location'], 'Choisissez un emplacement');
  else if (v.location === 'wall' && v.access === null) report(['access'], 'Choisissez un accès');
}

/* ==========================================================================
   Installation
   ========================================================================== */

const largeInstallationFormSchema = z.object({
  dimensions: text(LARGE_TEXT_LIMITS.dimensions),
  ...placementShape,
  structures: z.array(z.enum(STRUCTURES)),
  aluminumAcquisition: z.enum(ACQUISITIONS).nullable(),
  signageAcquisition: z.enum(ACQUISITIONS).nullable(),
  woodFramdStyle: z.enum(WOOD_FRAMD_STYLES).nullable(),
  woodFramdPaint: z.boolean().nullable(),
  woodFramdColor: text(LARGE_TEXT_LIMITS.paintColor),
  easelStyle: z.enum(EASEL_STYLES).nullable(),
  easelPaint: z.boolean().nullable(),
  easelColor: text(LARGE_TEXT_LIMITS.paintColor),
});

type InstallationOutput = z.output<typeof largeInstallationFormSchema>;

/** Peindre ? (Oui / Non), puis la couleur si Oui */
function validatePaint(
  paint: boolean | null,
  color: string,
  prefix: 'woodFramd' | 'easel',
  report: Report,
) {
  if (paint === null) report([`${prefix}Paint`], REQUIRED);
  else if (paint && !color) report([`${prefix}Color`], 'Indiquez la couleur');
}

function toStructure(s: Structure, v: InstallationOutput): StructureChoice {
  switch (s) {
    case 'aluminumFramd':
      return { structure: s, acquisition: defined(v.aluminumAcquisition) };
    case 'signageFramd':
      return { structure: s, acquisition: defined(v.signageAcquisition) };
    case 'woodFramd':
      return { structure: s, style: defined(v.woodFramdStyle), paintColor: defined(v.woodFramdPaint) ? v.woodFramdColor : null };
    case 'woodEasel':
      return { structure: s, style: defined(v.easelStyle), paintColor: defined(v.easelPaint) ? v.easelColor : null };
  }
}

export const largeInstallationSchema = largeInstallationFormSchema
  .superRefine((v, ctx) => {
    const report = reporter(ctx);
    if (!v.dimensions) report(['dimensions'], 'Indiquez les dimensions');
    validatePlacement(v, report);
    if (v.location !== 'ground') return;

    if (v.structures.length === 0) report(['structures'], 'Sélectionnez au moins une structure');
    const has = (s: Structure) => v.structures.includes(s);
    if (has('aluminumFramd') && v.aluminumAcquisition === null) report(['aluminumAcquisition'], REQUIRED);
    if (has('signageFramd') && v.signageAcquisition === null) report(['signageAcquisition'], REQUIRED);
    if (has('woodFramd')) {
      if (v.woodFramdStyle === null) report(['woodFramdStyle'], 'Choisissez un style');
      validatePaint(v.woodFramdPaint, v.woodFramdColor, 'woodFramd', report);
    }
    if (has('woodEasel')) {
      if (v.easelStyle === null) report(['easelStyle'], 'Choisissez un style');
      validatePaint(v.easelPaint, v.easelColor, 'easel', report);
    }
  })
  .transform((v): LargeInstallationDetails =>
    defined(v.location) === 'wall'
      ? { dimensions: v.dimensions, location: 'wall', access: defined(v.access) }
      : {
          dimensions: v.dimensions,
          location: 'ground',
          // Ordre de la liste, quel que soit l'ordre des clics
          structures: STRUCTURES.filter((s) => v.structures.includes(s)).map((s) => toStructure(s, v)),
        },
  );

export type LargeInstallationFormValues = z.input<typeof largeInstallationSchema>;

export const createEmptyLargeInstallationForm = (): LargeInstallationFormValues => ({
  dimensions: '',
  location: 'ground',
  access: null,
  structures: [],
  aluminumAcquisition: null,
  signageAcquisition: null,
  woodFramdStyle: null,
  woodFramdPaint: null,
  woodFramdColor: '',
  easelStyle: null,
  easelPaint: null,
  easelColor: '',
});

export function toLargeInstallationFormValues(d: LargeInstallationDetails): LargeInstallationFormValues {
  const values: LargeInstallationFormValues = {
    ...createEmptyLargeInstallationForm(),
    dimensions: d.dimensions,
    location: d.location,
  };
  if (d.location === 'wall') return { ...values, access: d.access };

  for (const s of d.structures) {
    values.structures.push(s.structure);
    switch (s.structure) {
      case 'aluminumFramd':
        values.aluminumAcquisition = s.acquisition;
        break;
      case 'signageFramd':
        values.signageAcquisition = s.acquisition;
        break;
      case 'woodFramd':
        values.woodFramdStyle = s.style;
        values.woodFramdPaint = s.paintColor !== null;
        values.woodFramdColor = s.paintColor ?? '';
        break;
      case 'woodEasel':
        values.easelStyle = s.style;
        values.easelPaint = s.paintColor !== null;
        values.easelColor = s.paintColor ?? '';
        break;
    }
  }
  return values;
}

/* ==========================================================================
   Ramassage pour entreposage
   ========================================================================== */

export const largeStoragePickupSchema = z
  .object({ materials: z.array(z.enum(STORAGE_PICKUP_MATERIALS)) })
  .superRefine((v, ctx) => {
    if (v.materials.length === 0) reporter(ctx)(['materials'], 'Sélectionnez au moins un élément à ramasser');
  })
  .transform((v): LargeStoragePickupDetails => ({
    // Ordre de la liste, quel que soit l'ordre des clics
    materials: STORAGE_PICKUP_MATERIALS.filter((m) => v.materials.includes(m)),
  }));

export type LargeStoragePickupFormValues = z.input<typeof largeStoragePickupSchema>;

export const createEmptyLargeStoragePickupForm = (): LargeStoragePickupFormValues => ({ materials: [] });

export const toLargeStoragePickupFormValues = (d: LargeStoragePickupDetails): LargeStoragePickupFormValues => ({
  materials: [...d.materials],
});

/* ==========================================================================
   Récupération
   ========================================================================== */

export const largeRetrievalSchema = z
  .object(placementShape)
  .superRefine((v, ctx) => validatePlacement(v, reporter(ctx)))
  .transform((v): LargeRetrievalDetails =>
    defined(v.location) === 'wall' ? { location: 'wall', access: defined(v.access) } : { location: 'ground' },
  );

export type LargeRetrievalFormValues = z.input<typeof largeRetrievalSchema>;

export const createEmptyLargeRetrievalForm = (): LargeRetrievalFormValues => ({ location: 'ground', access: null });

export const toLargeRetrievalFormValues = (d: LargeRetrievalDetails): LargeRetrievalFormValues =>
  d.location === 'wall' ? { location: 'wall', access: d.access } : { location: 'ground', access: null };
