import { z } from 'zod';
import {
  ADDONS, FLAG_MENTIONS, FRAME_MODELS, IMPLEMENTED_MATERIALS, KEYBOX_CODE_MAX_DIGITS, KIT_MODELS,
  MAX_ADDONS, MAX_DIRECTIONALS, MAX_FLAGS, MAX_FRAMES, MAX_KITS, OPEN_HOUSE, SIGN_MENTIONS, TEXT_LIMITS,
  type Addon, type ImplementedMaterial,
} from '../constants/installation';
import type {
  AddonAssignment, FlagsDetails, FrameUnit, InstallationDetails, KitUnit, OpenHouseDetails, PlacedUnit, UnitTargets,
} from '../types/installation';
import { addMinutesClamped, isNextDay, isValidIsoDate, isValidTime, toMinutes } from '../utils/time';
import {
  createEmptyPlacement, fromPlacement, placementFormSchema, toPlacement, validatePlacement,
} from './placement.schema';
import { REQUIRED, defined, text, type Path, type Report } from './shared';

// Réexport : les composants et les tests continuent d'importer depuis ce fichier
export { createEmptyPlacement, type PlacementFormValues } from './placement.schema';

interface SessionContext {
  isMember: boolean;
  accountName: string | null;
}

/* ==========================================================================
   Forme du formulaire (plate, nullable)
   Ordre : chaque schéma est déclaré AVANT ceux qui l'utilisent.
   ========================================================================== */

/* ---------- Briques partagées ---------- */

/** Champs de répartition partagés (ajouts, visite libre) */
const targetsFormShape = {
  quantity: z.number().int().min(1, 'Minimum 1'),
  frameUids: z.array(z.string()),
  onSite: z.boolean(),
};

/** Unité dont seul l'emplacement est précisé (directionnelles) */
const placedUnitFormSchema = (maxLength: number) =>
  z.object({ uid: z.string().min(1), placement: text(maxLength) });

const KEYBOX_CODE_REGEX = new RegExp(`^\\d{0,${KEYBOX_CODE_MAX_DIGITS}}$`);

/* ---------- Schémas par matériel ---------- */

const frameUnitFormSchema = z.object({
  uid: z.string().min(1),
  model: z.enum(FRAME_MODELS).nullable(),
  modelDescription: text(TEXT_LIMITS.modelDescription),
  useAccountName: z.boolean().nullable(),
  displayName: text(TEXT_LIMITS.displayName),
});

const kitUnitFormSchema = z.object({
  uid: z.string().min(1),
  model: z.enum(KIT_MODELS).nullable(),
  description: text(TEXT_LIMITS.kitDescription),
});

const addonEntryFormSchema = z.object({
  addon: z.enum(ADDONS),
  mention: text(TEXT_LIMITS.addonMention),
  ...targetsFormShape,
});

const openHouseFormSchema = z.object({
  ...targetsFormShape,
  dates: z.array(z.string()).max(OPEN_HOUSE.maxDates),
  twoDates: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
  directionals: z
    .array(placedUnitFormSchema(TEXT_LIMITS.directionalPlacement))
    .max(OPEN_HOUSE.maxDirectionals, `Maximum ${OPEN_HOUSE.maxDirectionals} directionnelles`),
  flagCount: z.number().int().min(0).max(OPEN_HOUSE.maxFlags, `Maximum ${OPEN_HOUSE.maxFlags} drapeaux`),
  removeNextMonday: z.boolean().nullable(),
});

/* ---------- Schéma racine (toujours en dernier) ---------- */

const installationFormSchema = z.object({
  materials: z.array(z.enum(IMPLEMENTED_MATERIALS)),
  placement: placementFormSchema,
  frames: z.object({
    pickup: z.boolean().nullable(),
    pickupAddress: z.string().trim(),
    units: z.array(frameUnitFormSchema).max(MAX_FRAMES, `Maximum ${MAX_FRAMES} pancartes`),
  }),
  kits: z.object({
    units: z.array(kitUnitFormSchema).max(MAX_KITS, `Maximum ${MAX_KITS} kits`),
  }),
  addons: z.array(addonEntryFormSchema).max(MAX_ADDONS, `Maximum ${MAX_ADDONS} ajouts`),
  openHouse: openHouseFormSchema,
  keybox: z.object({
    code: z.string().trim().regex(KEYBOX_CODE_REGEX, `Code de ${KEYBOX_CODE_MAX_DIGITS} chiffres maximum`),
    placement: text(TEXT_LIMITS.keyboxPlacement),
  }),
  flags: z.object({
    mention: z.enum(FLAG_MENTIONS).nullable(),
    customMention: text(TEXT_LIMITS.flagMention),
    quantity: z.number().int().min(1, 'Minimum 1').max(MAX_FLAGS, `Maximum ${MAX_FLAGS} drapeaux`),
  }),
  directionals: z.object({
    mention: z.enum(SIGN_MENTIONS).nullable(),
    units: z
      .array(placedUnitFormSchema(TEXT_LIMITS.directionalPlacement))
      .max(MAX_DIRECTIONALS, `Maximum ${MAX_DIRECTIONALS} directionnelles`),
  }),
  otherNeeds: text(TEXT_LIMITS.otherNeeds),
});

type FormOutput = z.output<typeof installationFormSchema>;
type FrameUnitOutput = z.output<typeof frameUnitFormSchema>;
type AddonEntryOutput = z.output<typeof addonEntryFormSchema>;
type KitUnitOutput = z.output<typeof kitUnitFormSchema>;
type OpenHouseOutput = z.output<typeof openHouseFormSchema>;
type TargetsOutput = { quantity: number; frameUids: string[]; onSite: boolean };
type PlacedUnitOutput = { uid: string; placement: string };

/* ==========================================================================
   Règles conditionnelles
   ========================================================================== */

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
}

function validateKitUnit(k: KitUnitOutput, path: Path, report: Report) {
  if (k.model === null) report([...path, 'model'], 'Choisissez un modèle de kit');
  else if (k.model === 'custom' && !k.description) report([...path, 'description'], 'Décrivez votre poteau');
}

function validateTargets(t: TargetsOutput, path: Path, validFrameUids: Set<string>, report: Report) {
  const assigned = t.frameUids.length;
  const hasInvalidTarget =
    new Set(t.frameUids).size !== assigned || t.frameUids.some((uid) => !validFrameUids.has(uid));

  if (hasInvalidTarget) report([...path, 'frameUids'], 'Affectation de pancarte invalide');
  else if (assigned > t.quantity) {
    report([...path, 'frameUids'], `${assigned} pancarte(s) sélectionnée(s) pour ${t.quantity} unité(s)`);
  } else if (!t.onSite && assigned < t.quantity) {
    report(
      [...path, 'frameUids'],
      `Affectez ${t.quantity - assigned} unité(s) restante(s) ou choisissez « Pancarte sur place »`,
    );
  } else if (t.onSite && assigned === t.quantity) {
    report([...path, 'onSite'], 'Aucune unité restante pour une pancarte sur place');
  }
}

function validateAddon(a: AddonEntryOutput, path: Path, validFrameUids: Set<string>, report: Report) {
  if (a.addon === 'other' && !a.mention) report([...path, 'mention'], 'Indiquez la mention à afficher');
  validateTargets(a, path, validFrameUids, report);
}

function validatePlacedUnits(units: PlacedUnitOutput[], path: Path, emptyMessage: string, report: Report) {
  if (units.length === 0) report(path, emptyMessage);
}

function validateOpenHouse(o: OpenHouseOutput, path: Path, validFrameUids: Set<string>, report: Report) {
  validateTargets(o, path, validFrameUids, report);

  const expected = o.twoDates ? 2 : 1;
  if (o.dates.length !== expected || !o.dates.every(isValidIsoDate)) {
    report([...path, 'dates'], o.twoDates ? 'Choisissez deux dates' : 'Choisissez la date de la visite libre');
  } else if (o.twoDates) {
    const [first, second] = [...o.dates].sort();
    if (!isNextDay(first, second)) report([...path, 'dates'], 'Les deux dates doivent être consécutives');
  }

  const startValid = isValidTime(o.startTime);
  if (!startValid) report([...path, 'startTime'], 'Heure de début invalide');
  if (!isValidTime(o.endTime)) report([...path, 'endTime'], 'Heure de fin invalide');
  else if (startValid && toMinutes(o.endTime) <= toMinutes(o.startTime)) {
    report([...path, 'endTime'], "L'heure de fin doit être après l'heure de début");
  }

  if (o.removeNextMonday === null) report([...path, 'removeNextMonday'], REQUIRED);
}

/* ==========================================================================
   Transformation vers le domaine
   ========================================================================== */

function toFrameUnit(u: FrameUnitOutput, { isMember, accountName }: SessionContext): FrameUnit {
  const model = isMember ? defined(u.model) : null;
  return {
    uid: u.uid,
    model:
      model === null ? null
      : model === 'custom' ? { type: 'custom', description: u.modelDescription }
      : { type: model },
    displayName:
      accountName === null ? null
      : u.useAccountName ? { type: 'account', name: accountName }
      : { type: 'custom', names: u.displayName },
  };
}

function toKitUnit(k: KitUnitOutput): KitUnit {
  const model = defined(k.model);
  return {
    uid: k.uid,
    model: model === 'custom' ? { type: 'custom', description: k.description } : { type: model },
  };
}

function toTargets(t: TargetsOutput): UnitTargets {
  return {
    quantity: t.quantity,
    frameUids: t.frameUids,
    onSiteCount: t.onSite ? t.quantity - t.frameUids.length : 0,
  };
}

const toPlacedUnit = (u: PlacedUnitOutput): PlacedUnit => ({ uid: u.uid, placement: u.placement });

function toAddonAssignment(a: AddonEntryOutput): AddonAssignment {
  const base = toTargets(a);
  switch (a.addon) {
    case 'other':
      return { ...base, addon: 'other', mention: a.mention };
    case 'customNoMention':
      return { ...base, addon: 'customNoMention', details: a.mention || null };
    default:
      return { ...base, addon: a.addon };
  }
}

function toOpenHouse(o: OpenHouseOutput): OpenHouseDetails {
  return {
    ...toTargets(o),
    // Le format yyyy-MM-dd se trie correctement comme une chaîne
    dates: [...o.dates].sort(),
    startTime: o.startTime,
    endTime: o.endTime,
    directionals: o.directionals.map(toPlacedUnit),
    flagCount: o.flagCount,
    removeNextMonday: defined(o.removeNextMonday),
  };
}

function toFlags(f: FormOutput['flags']): FlagsDetails {
  const mention = defined(f.mention);
  return mention === 'other'
    ? { mention, customMention: f.customMention, quantity: f.quantity }
    : { mention, quantity: f.quantity };
}

/* ==========================================================================
   Schéma public
   ========================================================================== */

export function createInstallationSchema(session: SessionContext) {
  const { isMember } = session;

  return installationFormSchema
    .superRefine((v, ctx) => {
      const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
      const has = (m: ImplementedMaterial) => v.materials.includes(m);
      const hasFrames = has('frames');
      const validFrameUids = new Set(hasFrames ? v.frames.units.map((u) => u.uid) : []);

      if (v.materials.length === 0) report(['materials'], 'Sélectionnez au moins un élément à installer');
      else validatePlacement(v.placement, ['placement'], report);

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

      // Kit seul : avec des pancartes, il est inclus et n'a aucun détail à valider
      if (has('kit') && !hasFrames) {
        if (v.kits.units.length === 0) report(['kits', 'units'], 'Indiquez au moins un kit');
        v.kits.units.forEach((k, i) => validateKitUnit(k, ['kits', 'units', i], report));
      }

      if (has('addons')) {
        if (v.addons.length === 0) report(['addons'], 'Sélectionnez au moins un ajout');
        const keys = v.addons.map((a) => a.addon);
        if (new Set(keys).size !== keys.length) report(['addons'], 'Un ajout est sélectionné en double');
        v.addons.forEach((a, i) => validateAddon(a, ['addons', i], validFrameUids, report));
      }

      if (has('openHouse')) validateOpenHouse(v.openHouse, ['openHouse'], validFrameUids, report);

      if (has('keybox') && !v.keybox.code) report(['keybox', 'code'], 'Indiquez le code de la boîte à clés');

      if (has('flags')) {
        if (v.flags.mention === null) report(['flags', 'mention'], 'Choisissez la mention du drapeau');
        else if (v.flags.mention === 'other' && !v.flags.customMention) {
          report(['flags', 'customMention'], 'Indiquez la mention du drapeau');
        }
      }

      if (has('directional')) {
        if (v.directionals.mention === null) {
          report(['directionals', 'mention'], 'Choisissez la mention de la directionnelle');
        }
        validatePlacedUnits(v.directionals.units, ['directionals', 'units'], 'Indiquez au moins une directionnelle', report);
      }

      if (has('other') && !v.otherNeeds) report(['otherNeeds'], 'Décrivez votre besoin');
    })
    .transform((v: FormOutput): InstallationDetails => {
      const has = (m: ImplementedMaterial) => v.materials.includes(m);
      const hasFrames = has('frames');

      return {
        placement: toPlacement(v.placement),
        frames: hasFrames
          ? {
              pickupAddress: !isMember && v.frames.pickup ? v.frames.pickupAddress : null,
              units: v.frames.units.map((u) => toFrameUnit(u, session)),
            }
          : null,
        kits: has('kit') && !hasFrames ? { units: v.kits.units.map(toKitUnit) } : null,
        addons: has('addons') ? v.addons.map(toAddonAssignment) : null,
        openHouse: has('openHouse') ? toOpenHouse(v.openHouse) : null,
        keybox: has('keybox') ? { code: v.keybox.code, placement: v.keybox.placement } : null,
        flags: has('flags') ? toFlags(v.flags) : null,
        directionals: has('directional')
          ? { mention: defined(v.directionals.mention), units: v.directionals.units.map(toPlacedUnit) }
          : null,
        otherNeeds: has('other') ? v.otherNeeds : null,
      };
    });
}

/* ==========================================================================
   Types et valeurs initiales du formulaire
   ========================================================================== */

export type InstallationSchema = ReturnType<typeof createInstallationSchema>;
export type InstallationFormValues = z.input<InstallationSchema>;
export type FrameUnitFormValues = z.input<typeof frameUnitFormSchema>;
export type KitUnitFormValues = z.input<typeof kitUnitFormSchema>;
export type AddonEntryFormValues = z.input<typeof addonEntryFormSchema>;
export type OpenHouseFormValues = z.input<typeof openHouseFormSchema>;
export type PlacedUnitFormValues = PlacedUnitOutput;

export const createFrameUnit = (): FrameUnitFormValues => ({
  uid: crypto.randomUUID(),
  model: 'regular',
  modelDescription: '',
  useAccountName: true,
  displayName: '',
});

export const createKitUnit = (): KitUnitFormValues => ({
  uid: crypto.randomUUID(),
  model: null,
  description: '',
});

export const createAddonEntry = (addon: Addon): AddonEntryFormValues => ({
  addon,
  mention: '',
  quantity: 1,
  frameUids: [],
  onSite: false,
});

export const createPlacedUnit = (): PlacedUnitFormValues => ({ uid: crypto.randomUUID(), placement: '' });

/** Alias conservé : utilisé par la visite libre */
export const createDirectional = createPlacedUnit;

export const createEmptyOpenHouse = (): OpenHouseFormValues => ({
  quantity: 1,
  frameUids: [],
  onSite: false,
  dates: [],
  twoDates: false,
  startTime: OPEN_HOUSE.defaultStartTime,
  endTime: addMinutesClamped(OPEN_HOUSE.defaultStartTime, OPEN_HOUSE.defaultDurationMinutes),
  directionals: [],
  flagCount: 0,
  removeNextMonday: null,
});

export const createEmptyInstallationForm = (): InstallationFormValues => ({
  materials: [],
  placement: createEmptyPlacement(),
  frames: { pickup: null, pickupAddress: '', units: [] },
  kits: { units: [] },
  addons: [],
  openHouse: createEmptyOpenHouse(),
  keybox: { code: '', placement: '' },
  flags: { mention: null, customMention: '', quantity: 1 },
  directionals: { mention: null, units: [] },
  otherNeeds: '',
});

/* ==========================================================================
   Conversion inverse (domaine → formulaire)
   Permet de rouvrir une installation enregistrée pour la modifier.
   ========================================================================== */

function fromFrameUnit(u: FrameUnit): FrameUnitFormValues {
  return {
    uid: u.uid,
    model: u.model?.type ?? null,
    modelDescription: u.model?.type === 'custom' ? u.model.description : '',
    useAccountName: u.displayName === null ? null : u.displayName.type === 'account',
    displayName: u.displayName?.type === 'custom' ? u.displayName.names : '',
  };
}

function fromKitUnit(k: KitUnit): KitUnitFormValues {
  return {
    uid: k.uid,
    model: k.model.type,
    description: k.model.type === 'custom' ? k.model.description : '',
  };
}

function fromTargets(t: UnitTargets): TargetsOutput {
  // Copie : le formulaire ne partage aucune référence avec le store
  return { quantity: t.quantity, frameUids: [...t.frameUids], onSite: t.onSiteCount > 0 };
}

const fromPlacedUnit = (u: PlacedUnit): PlacedUnitFormValues => ({ ...u });

function fromAddon(a: AddonAssignment): AddonEntryFormValues {
  return {
    addon: a.addon,
    mention:
      a.addon === 'other' ? a.mention
      : a.addon === 'customNoMention' ? a.details ?? ''
      : '',
    ...fromTargets(a),
  };
}

function fromOpenHouse(o: OpenHouseDetails): OpenHouseFormValues {
  return {
    ...fromTargets(o),
    dates: [...o.dates],
    twoDates: o.dates.length > 1,
    startTime: o.startTime,
    endTime: o.endTime,
    directionals: o.directionals.map(fromPlacedUnit),
    flagCount: o.flagCount,
    removeNextMonday: o.removeNextMonday,
  };
}

export function toInstallationFormValues(details: InstallationDetails): InstallationFormValues {
  const empty = createEmptyInstallationForm();

  // Les installations enregistrées avant l'ajout d'un matériel n'ont pas son champ : undefined = non sélectionné
  const materials: ImplementedMaterial[] = [];
  if (details.frames) materials.push('frames');
  if (details.kits) materials.push('kit');
  if (details.addons) materials.push('addons');
  if (details.openHouse) materials.push('openHouse');
  if (details.keybox) materials.push('keybox');
  if (details.flags) materials.push('flags');
  if (details.directionals) materials.push('directional');
  if (details.otherNeeds) materials.push('other');

  return {
    materials,
    placement: fromPlacement(details.placement),
    frames: details.frames
      ? {
          pickup: details.frames.pickupAddress !== null,
          pickupAddress: details.frames.pickupAddress ?? '',
          units: details.frames.units.map(fromFrameUnit),
        }
      : empty.frames,
    kits: details.kits ? { units: details.kits.units.map(fromKitUnit) } : empty.kits,
    addons: details.addons?.map(fromAddon) ?? [],
    openHouse: details.openHouse ? fromOpenHouse(details.openHouse) : empty.openHouse,
    keybox: details.keybox
      ? { code: details.keybox.code, placement: details.keybox.placement ?? '' }
      : empty.keybox,
    flags: details.flags
      ? {
          mention: details.flags.mention,
          customMention: details.flags.mention === 'other' ? details.flags.customMention : '',
          quantity: details.flags.quantity,
        }
      : empty.flags,
    directionals: details.directionals
      ? { mention: details.directionals.mention, units: details.directionals.units.map(fromPlacedUnit) }
      : empty.directionals,
    otherNeeds: details.otherNeeds ?? '',
  };
}