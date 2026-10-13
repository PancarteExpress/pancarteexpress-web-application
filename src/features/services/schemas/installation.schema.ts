import { z } from 'zod';
import {
  ACCESS_CHOICES, ADDONS, FRAME_MODELS, IMPLEMENTED_MATERIALS, LOCATIONS,
  MAX_ADDONS, MAX_FRAMES, MOUNTINGS, TEXT_LIMITS, type Addon,
} from '../constants/installation';
import type {
  AddonAssignment, FramePlacement, FrameUnit, InstallationDetails,
} from '../types/installation';

import type { ImplementedMaterial } from '../constants/installation';

interface SessionContext {
  isMember: boolean;
  accountName: string | null;
}

export type PlacementFormValues = z.input<typeof placementFormSchema>;

const REQUIRED = 'Ce champ est requis';
const tooLong = (max: number) => `Maximum ${max} caractères`;
const text = (max: number) => z.string().trim().max(max, tooLong(max));

/* ---------- Forme du formulaire (plate, nullable) ---------- */

const placementFormSchema = z.object({
  location: z.enum(LOCATIONS).nullable(),
  access: z.enum(ACCESS_CHOICES).nullable(),
  mounting: z.enum(MOUNTINGS).nullable(),
  contact: text(TEXT_LIMITS.appointmentContact),
  description: text(TEXT_LIMITS.placementDescription),
});

const frameUnitFormSchema = z.object({
  uid: z.string().min(1),
  model: z.enum(FRAME_MODELS).nullable(),
  modelDescription: text(TEXT_LIMITS.modelDescription),
  useAccountName: z.boolean().nullable(),
  displayName: text(TEXT_LIMITS.displayName),
  placement: placementFormSchema,
});

const addonEntryFormSchema = z.object({
  addon: z.enum(ADDONS),
  mention: text(TEXT_LIMITS.addonMention),
  quantity: z.number().int().min(1, 'Minimum 1'),
  frameUids: z.array(z.string()),
  onSite: z.boolean(),
});

const installationFormSchema = z.object({
  materials: z.array(z.enum(IMPLEMENTED_MATERIALS)),
  frames: z.object({
    pickup: z.boolean().nullable(),
    pickupAddress: z.string().trim(),
    units: z.array(frameUnitFormSchema).max(MAX_FRAMES, `Maximum ${MAX_FRAMES} pancartes`),
  }),
  addons: z.array(addonEntryFormSchema).max(MAX_ADDONS, `Maximum ${MAX_ADDONS} ajouts`),
});

type FormOutput = z.output<typeof installationFormSchema>;
type FrameUnitOutput = z.output<typeof frameUnitFormSchema>;
type PlacementOutput = z.output<typeof placementFormSchema>;
type AddonEntryOutput = z.output<typeof addonEntryFormSchema>;
type Path = (string | number)[];
type Report = (path: Path, message: string) => void;

/* ---------- Règles conditionnelles ---------- */

function validatePlacement(p: PlacementOutput, path: Path, report: Report) {
  if (p.location === null) return report([...path, 'location'], 'Choisissez un emplacement');

  switch (p.location) {
    case 'wall':
      if (p.access === null || p.access === 'phoneAppointment') {
        report([...path, 'access'], "Choisissez une option d'échelle");
      }
      if (p.mounting === null) report([...path, 'mounting'], 'Choisissez une méthode de fixation');
      break;
    case 'fence':
    case 'balcony':
      if (p.access === null) report([...path, 'access'], REQUIRED);
      else if (p.access === 'phoneAppointment' && !p.contact) {
        report([...path, 'contact'], 'Indiquez vos coordonnées');
      }
      break;
    case 'other':
      if (!p.description) report([...path, 'description'], "Décrivez l'emplacement");
      break;
  }
}

function validateFrameUnit(u: FrameUnitOutput, path: Path, session: SessionContext, report: Report) {
  if (session.isMember) {
    if (u.model === null) report([...path, 'model'], 'Choisissez un modèle');
    else if (u.model === 'custom' && !u.modelDescription) {
      report([...path, 'modelDescription'], 'Décrivez le modèle');
    }
  }

  if (session.accountName !== null) {
    if (u.useAccountName === null) report([...path, 'useAccountName'], REQUIRED);
    else if (!u.useAccountName && !u.displayName) {
      report([...path, 'displayName'], 'Indiquez le(s) nom(s) à afficher');
    }
  }

  validatePlacement(u.placement, [...path, 'placement'], report);
}

function validateAddon(a: AddonEntryOutput, path: Path, validFrameUids: Set<string>, report: Report) {
  if (a.addon === 'other' && !a.mention) report([...path, 'mention'], 'Indiquez la mention à afficher');

  const assigned = a.frameUids.length;
  const hasInvalidTarget =
    new Set(a.frameUids).size !== assigned || a.frameUids.some((uid) => !validFrameUids.has(uid));

  if (hasInvalidTarget) report([...path, 'frameUids'], 'Affectation de pancarte invalide');
  else if (assigned > a.quantity) {
    report([...path, 'frameUids'], `${assigned} pancarte(s) sélectionnée(s) pour ${a.quantity} unité(s)`);
  } else if (!a.onSite && assigned < a.quantity) {
    report(
      [...path, 'frameUids'],
      `Affectez ${a.quantity - assigned} unité(s) restante(s) ou choisissez « Pancarte sur place »`,
    );
  } else if (a.onSite && assigned === a.quantity) {
    report([...path, 'onSite'], 'Aucune unité restante pour une pancarte sur place');
  }
}

/* ---------- Transformation vers le domaine ---------- */

/** Invariant : appelée uniquement après un superRefine réussi. */
function defined<T>(value: T | null): T {
  if (value === null) throw new Error('Invariant violé : valeur non validée');
  return value;
}

function toPlacement(p: PlacementOutput): FramePlacement {
  const location = defined(p.location);
  switch (location) {
    case 'ground':
    case 'ramp':
      return { location };
    case 'wall': {
      const access = defined(p.access);
      if (access === 'phoneAppointment') throw new Error('Invariant violé : accès mural');
      return { location, ladder: access, mounting: defined(p.mounting) };
    }
    case 'fence':
    case 'balcony': {
      const access = defined(p.access);
      return {
        location,
        access: access === 'phoneAppointment'
          ? { type: 'phoneAppointment', contact: p.contact }
          : { type: 'ladder', ladder: access },
      };
    }
    case 'other':
      return { location, description: p.description };
  }
}

function toFrameUnit(u: FrameUnitOutput, { isMember, accountName }: SessionContext): FrameUnit {
  const model = isMember ? defined(u.model) : null;
  return {
    uid: u.uid,
    model: model === null ? null : model === 'custom' ? { type: 'custom', description: u.modelDescription } : { type: model },
    displayName: accountName === null ? null : u.useAccountName ? { type: 'account', name: accountName } : { type: 'custom', names: u.displayName },
    placement: toPlacement(u.placement),
  };
}

function toAddonAssignment(a: AddonEntryOutput): AddonAssignment {
  const base = {
    quantity: a.quantity,
    frameUids: a.frameUids,
    onSiteCount: a.onSite ? a.quantity - a.frameUids.length : 0,
  };
  return a.addon === 'other' ? { ...base, addon: 'other', mention: a.mention } : { ...base, addon: a.addon };
}

/* ---------- Schéma public ---------- */

export function createInstallationSchema(session: SessionContext) {
  const { isMember } = session;

  return installationFormSchema
    .superRefine((v, ctx) => {
      const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
      const hasFrames = v.materials.includes('frames');

      if (v.materials.length === 0) report(['materials'], 'Sélectionnez au moins un élément à installer');

      if (hasFrames) {
        if (!isMember) {
          if (v.frames.pickup === null) report(['frames', 'pickup'], REQUIRED);
          else if (v.frames.pickup && !v.frames.pickupAddress) {
            report(['frames', 'pickupAddress'], "Indiquez l'adresse de ramassage");
          }
        }
        if (v.frames.units.length === 0) report(['frames', 'units'], 'Indiquez au moins une pancarte');
        v.frames.units.forEach((u, i) => validateFrameUnit(u, ['frames', 'units', i], session, report));
      }

      if (v.materials.includes('addons')) {
        if (v.addons.length === 0) report(['addons'], 'Sélectionnez au moins un ajout');

        const keys = v.addons.map((a) => a.addon);
        if (new Set(keys).size !== keys.length) report(['addons'], 'Un ajout est sélectionné en double');

        const validFrameUids = new Set(hasFrames ? v.frames.units.map((u) => u.uid) : []);
        v.addons.forEach((a, i) => validateAddon(a, ['addons', i], validFrameUids, report));
      }
    })
    .transform((v: FormOutput): InstallationDetails => ({
      frames: v.materials.includes('frames')
        ? {
            pickupAddress: !isMember && v.frames.pickup ? v.frames.pickupAddress : null,
            units: v.frames.units.map((u) => toFrameUnit(u, session)),
          }
        : null,
      addons: v.materials.includes('addons') ? v.addons.map(toAddonAssignment) : null,
    }));
}

/* ---------- Types et valeurs initiales du formulaire ---------- */

export type InstallationSchema = ReturnType<typeof createInstallationSchema>;
export type InstallationFormValues = z.input<InstallationSchema>;
export type FrameUnitFormValues = z.input<typeof frameUnitFormSchema>;
export type AddonEntryFormValues = z.input<typeof addonEntryFormSchema>;

export const createFrameUnit = (): FrameUnitFormValues => ({
  uid: crypto.randomUUID(),
  model: null,
  modelDescription: '',
  useAccountName: null,
  displayName: '',
  placement: createEmptyPlacement(),
});

export const createAddonEntry = (addon: Addon): AddonEntryFormValues => ({
  addon,
  mention: '',
  quantity: 1,
  frameUids: [],
  onSite: false,
});

export const createEmptyInstallationForm = (): InstallationFormValues => ({
  materials: [],
  frames: { pickup: null, pickupAddress: '', units: [] },
  addons: [],
});

export const createEmptyPlacement = (): PlacementFormValues => ({
  location: null, access: null, mounting: null, contact: '', description: '',
});


// permet de rouvrir une installation enregistrée pour la modifier.

function fromPlacement(p: FramePlacement): PlacementFormValues {
  const empty = createEmptyPlacement();
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return { ...empty, location: p.location };
    case 'wall':
      return { ...empty, location: p.location, access: p.ladder, mounting: p.mounting };
    case 'fence':
    case 'balcony':
      return p.access.type === 'ladder'
        ? { ...empty, location: p.location, access: p.access.ladder }
        : { ...empty, location: p.location, access: 'phoneAppointment', contact: p.access.contact };
    case 'other':
      return { ...empty, location: p.location, description: p.description };
  }
}

function fromFrameUnit(u: FrameUnit): FrameUnitFormValues {
  return {
    uid: u.uid,
    model: u.model?.type ?? null,
    modelDescription: u.model?.type === 'custom' ? u.model.description : '',
    useAccountName: u.displayName === null ? null : u.displayName.type === 'account',
    displayName: u.displayName?.type === 'custom' ? u.displayName.names : '',
    placement: fromPlacement(u.placement),
  };
}

function fromAddon(a: AddonAssignment): AddonEntryFormValues {
  return {
    addon: a.addon,
    mention: a.addon === 'other' ? a.mention : '',
    quantity: a.quantity,
    frameUids: [...a.frameUids], // copie : le formulaire ne partage aucune référence avec le store
    onSite: a.onSiteCount > 0,
  };
}

export function toInstallationFormValues(details: InstallationDetails): InstallationFormValues {
  const materials: ImplementedMaterial[] = [];
  if (details.frames) materials.push('frames');
  if (details.addons) materials.push('addons');

  return {
    materials,
    frames: details.frames
      ? {
          pickup: details.frames.pickupAddress !== null,
          pickupAddress: details.frames.pickupAddress ?? '',
          units: details.frames.units.map(fromFrameUnit),
        }
      : { pickup: null, pickupAddress: '', units: [] },
    addons: details.addons?.map(fromAddon) ?? [],
  };
}