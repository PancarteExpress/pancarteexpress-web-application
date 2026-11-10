import * as z from 'zod';
import {
  ADDONS, ADDONS_WITH_MODEL, FLAG_MENTIONS, KIT_MODELS, LADDERS, MOUNTINGS, SIGN_MENTIONS, WINDOW_SIDES,
} from '../constants/installation';
import { PICKUP_MATERIALS } from '../constants/pickup';
import { CORRECTION_KINDS } from '../constants/correction';
import type { InstallationDetails, Placement } from '../types/installation';
import type { RemovalDetails } from '../types/removal';
import type { PickupDetails } from '../types/pickup';
import type { CorrectionDetails } from '../types/correction';
import { isValidIsoDate, isValidTime } from '../utils/time';

/**
 * Schémas de la forme DOMAINE (sortie des schémas de formulaire), telle que stockée dans Service.details.
 * Aucune règle liée au moment de la saisie (date future, etc.) : une ancienne commande reste lisible.
 */

/** Matériel absent des anciennes données (ajouté après coup) : undefined = non sélectionné */
const absent = <T extends z.ZodType>(schema: T) => schema.nullable().default(null);

const uid = z.string().min(1);
const placedUnit = z.object({ uid, placement: z.string() });

/* ---------- Emplacement ---------- */

const accessSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ladder'), ladder: z.enum(LADDERS) }),
  z.object({ type: z.literal('phoneAppointment'), contact: z.string() }),
  z.object({ type: z.literal('keybox'), info: z.string() }),
]);

const placementSchema = z.discriminatedUnion('location', [
  z.object({ location: z.literal(['ground', 'ramp']) }),
  z.object({ location: z.literal('wall'), ladder: z.enum(LADDERS), mounting: z.enum(MOUNTINGS) }),
  z.object({ location: z.literal('balcony'), access: accessSchema }),
  z.object({ location: z.literal('window'), access: accessSchema, side: z.enum(WINDOW_SIDES) }),
  z.object({ location: z.literal('other'), description: z.string() }),
]) satisfies z.ZodType<Placement>;

/* ---------- Installation ---------- */

const frameModelSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(['regular', 'prestige']) }),
  z.object({ type: z.literal('custom'), description: z.string() }),
]);

const targets = {
  quantity: z.number().int().min(1),
  frameUids: z.array(z.string()),
  onSiteCount: z.number().int().min(0),
};

const addonSchema = z.union([
  z.object({ ...targets, addon: z.literal('other'), mention: z.string() }),
  z.object({ ...targets, addon: z.literal('customNoMention'), details: z.string().nullable() }),
  z.object({ ...targets, addon: z.enum(ADDONS_WITH_MODEL), model: frameModelSchema }),
  z.object({ ...targets, addon: z.enum(ADDONS).exclude(['other', 'customNoMention', ...ADDONS_WITH_MODEL]) }),
]);

const flagsSchema = z.union([
  z.object({ quantity: z.number().int().min(1), mention: z.enum(FLAG_MENTIONS).exclude(['other']) }),
  z.object({ quantity: z.number().int().min(1), mention: z.literal('other'), customMention: z.string() }),
]);

const openHouseSchema = z.object({
  ...targets,
  dates: z.array(z.string().refine(isValidIsoDate)).min(1).max(2),
  startTime: z.string().refine(isValidTime),
  endTime: z.string().refine(isValidTime),
  directionals: z.array(placedUnit),
  flagCount: z.number().int().min(0),
  removeNextMonday: z.boolean(),
});

export const installationDetailsSchema = z.object({
  placement: placementSchema,
  frames: absent(z.object({
    pickupAddress: z.string().nullable(),
    units: z.array(z.object({
      uid,
      model: frameModelSchema.nullable(),
      displayName: z.discriminatedUnion('type', [
        z.object({ type: z.literal('account'), name: z.string() }),
        z.object({ type: z.literal('custom'), names: z.string() }),
      ]).nullable(),
    })).min(1),
  })),
  kits: absent(z.object({
    units: z.array(z.object({
      uid,
      model: z.discriminatedUnion('type', [
        z.object({ type: z.enum(KIT_MODELS).exclude(['custom']) }),
        z.object({ type: z.literal('custom'), description: z.string() }),
      ]),
    })).min(1),
  })),
  addons: absent(z.array(addonSchema).min(1)),
  openHouse: absent(openHouseSchema),
  keybox: absent(z.object({ code: z.string().min(1), placement: z.string() })),
  flags: absent(flagsSchema),
  directionals: absent(z.object({ mention: z.enum(SIGN_MENTIONS), units: z.array(placedUnit).min(1) })),
  otherNeeds: absent(z.string()),
}) satisfies z.ZodType<InstallationDetails>;

/* ---------- Retrait ---------- */

const removalUnit = z.object({ uid, placement: placementSchema });

export const removalDetailsSchema = z.object({
  frames: absent(z.object({ units: z.array(removalUnit).min(1) })),
  addons: absent(z.object({ units: z.array(removalUnit).min(1), details: z.string().nullable() })),
  keybox: absent(z.object({ quantity: z.number().int().min(1), code: z.string().min(1), placement: z.string() })),
  flags: absent(z.object({ quantity: z.number().int().min(1), placement: z.string() })),
  directionals: absent(z.object({ units: z.array(placedUnit).min(1) })),
  otherDetails: absent(z.string()),
}) satisfies z.ZodType<RemovalDetails>;

/* ---------- Ramassage ---------- */

export const pickupDetailsSchema = z.object({
  materials: z.array(z.enum(PICKUP_MATERIALS)).min(1),
  newModels: z.boolean(),
  details: z.string().nullable(),
}) satisfies z.ZodType<PickupDetails>;

/* ---------- Correction ---------- */

export const correctionDetailsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.enum(CORRECTION_KINDS).exclude(['explain']) }),
  z.object({ kind: z.literal('explain'), explanation: z.string().min(1) }),
]) satisfies z.ZodType<CorrectionDetails>;