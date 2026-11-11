import * as z from 'zod';
import {
  DELIVERY_ADDONS, DELIVERY_DIRECTIONAL_MODELS, DELIVERY_FRAME_MODELS, DELIVERY_LIMITS, DELIVERY_MATERIALS,
  DELIVERY_TEXT_LIMITS, REPEATABLE_ADDONS, REPEATABLE_DIRECTIONAL_MODELS, REPEATABLE_FRAME_MODELS,
  type DeliveryMaterial,
} from '../constants/delivery';
import type {
  DeliveryAddonItem, DeliveryDetails, DeliveryDirectional, DeliveryFrame,
} from '../types/delivery';
import { REQUIRED, defined, keyboxCode, text, type Path, type Report } from './shared';
import { issueMessage } from '@/shared/utils/issueMessage';

const quantity = (max: number) => {
  const range = issueMessage('quantityRange', { min: 1, max });
  return z.number().int().min(1, range).max(max, range);
};
const tooManyModels = (max: number) => issueMessage('tooManyModels', { max });

/* ==========================================================================
   Forme du formulaire (plate, nullable)
   ========================================================================== */

const frameFormSchema = z.object({
  uid: z.string().min(1),
  model: z.enum(DELIVERY_FRAME_MODELS).nullable(),
  description: text(DELIVERY_TEXT_LIMITS.customModel),
  quantity: quantity(DELIVERY_LIMITS.frameQuantity),
  withAnchorsAndPoles: z.boolean().nullable(),
});

const addonFormSchema = z.object({
  uid: z.string().min(1),
  addon: z.enum(DELIVERY_ADDONS).nullable(),
  mention: text(DELIVERY_TEXT_LIMITS.addonMention),
  customModel: text(DELIVERY_TEXT_LIMITS.customAddonModel),
  quantity: quantity(DELIVERY_LIMITS.addonQuantity),
});

const directionalFormSchema = z.object({
  uid: z.string().min(1),
  model: z.enum(DELIVERY_DIRECTIONAL_MODELS).nullable(),
  description: text(DELIVERY_TEXT_LIMITS.customModel),
  quantity: quantity(DELIVERY_LIMITS.directionalQuantity),
  withPoles: z.boolean().nullable(),
});

const otherFormSchema = z.object({
  uid: z.string().min(1),
  description: text(DELIVERY_TEXT_LIMITS.otherDescription),
  quantity: quantity(DELIVERY_LIMITS.otherQuantity),
});

const deliveryFormSchema = z.object({
  materials: z.array(z.enum(DELIVERY_MATERIALS)),
  frames: z.array(frameFormSchema).max(DELIVERY_LIMITS.frameModels, tooManyModels(DELIVERY_LIMITS.frameModels)),
  addons: z.array(addonFormSchema).max(DELIVERY_LIMITS.addonModels, tooManyModels(DELIVERY_LIMITS.addonModels)),
  keybox: z.object({
    quantity: quantity(DELIVERY_LIMITS.keyboxQuantity),
    code: keyboxCode(),
  }),
  directionals: z
    .array(directionalFormSchema)
    .max(DELIVERY_LIMITS.directionalModels, tooManyModels(DELIVERY_LIMITS.directionalModels)),
  others: z.array(otherFormSchema).max(DELIVERY_LIMITS.otherItems, tooManyModels(DELIVERY_LIMITS.otherItems)),
});

type FormOutput = z.output<typeof deliveryFormSchema>;

/* ==========================================================================
   Validation
   ========================================================================== */

/**
 * Un modèle ne peut pas être choisi deux fois, sauf les modèles « libres »,
 * que leur description distingue. L'erreur est placée sur la ligne en double.
 */
function validateNoDuplicates(
  values: (string | null)[],
  repeatable: readonly string[],
  path: Path,
  field: string,
  report: Report,
) {
  const seen = new Set<string>();
  values.forEach((value, i) => {
    if (value === null || repeatable.includes(value)) return;
    if (seen.has(value)) report([...path, i, field], 'Ce modèle est déjà dans la livraison');
    seen.add(value);
  });
}

function validateList(length: number, path: Path, report: Report) {
  if (length === 0) report(path, 'Ajoutez au moins un modèle');
}

export const deliverySchema = deliveryFormSchema
  .superRefine((v, ctx) => {
    const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
    const has = (m: DeliveryMaterial) => v.materials.includes(m);

    if (v.materials.length === 0) report(['materials'], 'Sélectionnez au moins un élément à livrer');

    if (has('frames')) {
      validateList(v.frames.length, ['frames'], report);
      v.frames.forEach((f, i) => {
        if (f.model === null) report(['frames', i, 'model'], 'Choisissez un modèle');
        else if (f.model === 'custom' && !f.description) report(['frames', i, 'description'], 'Décrivez le modèle');
        if (f.withAnchorsAndPoles === null) report(['frames', i, 'withAnchorsAndPoles'], REQUIRED);
      });
      validateNoDuplicates(v.frames.map((f) => f.model), REPEATABLE_FRAME_MODELS, ['frames'], 'model', report);
    }

    if (has('addons')) {
      validateList(v.addons.length, ['addons'], report);
      v.addons.forEach((a, i) => {
        if (a.addon === null) report(['addons', i, 'addon'], 'Choisissez un ajout');
        else if (a.addon === 'other' && !a.mention) report(['addons', i, 'mention'], 'Indiquez la mention de l\'ajout');
      });
      validateNoDuplicates(v.addons.map((a) => a.addon), REPEATABLE_ADDONS, ['addons'], 'addon', report);
    }

    if (has('directional')) {
      validateList(v.directionals.length, ['directionals'], report);
      v.directionals.forEach((d, i) => {
        if (d.model === null) report(['directionals', i, 'model'], 'Choisissez un modèle');
        else if (d.model === 'custom' && !d.description) report(['directionals', i, 'description'], 'Décrivez le modèle');
        if (d.withPoles === null) report(['directionals', i, 'withPoles'], REQUIRED);
      });
      validateNoDuplicates(
        v.directionals.map((d) => d.model), REPEATABLE_DIRECTIONAL_MODELS, ['directionals'], 'model', report,
      );
    }

    if (has('other')) {
      validateList(v.others.length, ['others'], report);
      v.others.forEach((o, i) => {
        if (!o.description) report(['others', i, 'description'], 'Décrivez le matériel');
      });
    }
  })
  .transform((v: FormOutput): DeliveryDetails => {
    const has = (m: DeliveryMaterial) => v.materials.includes(m);
    return {
      frames: has('frames') ? v.frames.map(toFrame) : null,
      addons: has('addons') ? v.addons.map(toAddon) : null,
      keybox: has('keybox') ? { quantity: v.keybox.quantity, code: v.keybox.code || null } : null,
      directionals: has('directional') ? v.directionals.map(toDirectional) : null,
      others: has('other') ? v.others.map((o) => ({ description: o.description, quantity: o.quantity })) : null,
    };
  });

/* ==========================================================================
   Formulaire → domaine
   ========================================================================== */

function toFrame(f: FormOutput['frames'][number]): DeliveryFrame {
  const model = defined(f.model);
  const base = { quantity: f.quantity, withAnchorsAndPoles: defined(f.withAnchorsAndPoles) };
  return model === 'custom' ? { ...base, model, description: f.description } : { ...base, model };
}

function toAddon(a: FormOutput['addons'][number]): DeliveryAddonItem {
  const addon = defined(a.addon);
  switch (addon) {
    case 'other':
      return { addon, mention: a.mention, quantity: a.quantity };
    case 'customNoMention':
      return { addon, model: a.customModel || null, quantity: a.quantity };
    default:
      return { addon, quantity: a.quantity };
  }
}

function toDirectional(d: FormOutput['directionals'][number]): DeliveryDirectional {
  const model = defined(d.model);
  const base = { quantity: d.quantity, withPoles: defined(d.withPoles) };
  return model === 'custom' ? { ...base, model, description: d.description } : { ...base, model };
}

/* ==========================================================================
   Valeurs initiales
   ========================================================================== */

export type DeliveryFormValues = z.input<typeof deliverySchema>;
type FrameFormValues = DeliveryFormValues['frames'][number];
type AddonFormValues = DeliveryFormValues['addons'][number];
type DirectionalFormValues = DeliveryFormValues['directionals'][number];
type OtherFormValues = DeliveryFormValues['others'][number];

/** « Régulier » et « Non » présélectionnés */
export const createDeliveryFrame = (): FrameFormValues => ({
  uid: crypto.randomUUID(), model: 'regular', description: '', quantity: 1, withAnchorsAndPoles: false,
});

export const createDeliveryAddon = (): AddonFormValues => ({
  uid: crypto.randomUUID(), addon: null, mention: '', customModel: '', quantity: 1,
});

/** « Non » présélectionné pour les poteaux */
export const createDeliveryDirectional = (): DirectionalFormValues => ({
  uid: crypto.randomUUID(), model: null, description: '', quantity: 1, withPoles: false,
});

export const createDeliveryOther = (): OtherFormValues => ({
  uid: crypto.randomUUID(), description: '', quantity: 1,
});

export const createEmptyDeliveryForm = (): DeliveryFormValues => ({
  materials: [],
  frames: [],
  addons: [],
  keybox: { quantity: 1, code: '' },
  directionals: [],
  others: [],
});

/* ==========================================================================
   Domaine → formulaire
   ========================================================================== */

export function toDeliveryFormValues(d: DeliveryDetails): DeliveryFormValues {
  const empty = createEmptyDeliveryForm();
  const materials: DeliveryFormValues['materials'] = [];
  if (d.frames) materials.push('frames');
  if (d.addons) materials.push('addons');
  if (d.keybox) materials.push('keybox');
  if (d.directionals) materials.push('directional');
  if (d.others) materials.push('other');

  return {
    materials,
    frames: d.frames?.map((f) => ({
      ...createDeliveryFrame(),
      model: f.model,
      description: f.model === 'custom' ? f.description : '',
      quantity: f.quantity,
      withAnchorsAndPoles: f.withAnchorsAndPoles,
    })) ?? empty.frames,
    addons: d.addons?.map((a) => ({
      ...createDeliveryAddon(),
      addon: a.addon,
      mention: a.addon === 'other' ? a.mention : '',
      customModel: a.addon === 'customNoMention' ? a.model ?? '' : '',
      quantity: a.quantity,
    })) ?? empty.addons,
    keybox: d.keybox ? { quantity: d.keybox.quantity, code: d.keybox.code ?? '' } : empty.keybox,
    directionals: d.directionals?.map((x) => ({
      ...createDeliveryDirectional(),
      model: x.model,
      description: x.model === 'custom' ? x.description : '',
      quantity: x.quantity,
      withPoles: x.withPoles,
    })) ?? empty.directionals,
    others: d.others?.map((o) => ({ ...createDeliveryOther(), ...o })) ?? empty.others,
  };
}