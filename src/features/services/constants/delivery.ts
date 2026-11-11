import { FRAME_MODELS } from './installation';

export const DELIVERY_MATERIALS = ['frames', 'addons', 'keybox', 'directional', 'other'] as const;
export type DeliveryMaterial = (typeof DELIVERY_MATERIALS)[number];

/** Modèles de pancartes : les mêmes qu'à l'installation */
export const DELIVERY_FRAME_MODELS = FRAME_MODELS;

export const DELIVERY_ADDONS = ['forSale', 'sold', 'forRent', 'rented', 'customNoMention', 'openHouse', 'other'] as const;
export type DeliveryAddon = (typeof DELIVERY_ADDONS)[number];

export const DELIVERY_DIRECTIONAL_MODELS = ['forSale', 'openHouse', 'custom'] as const;
export type DeliveryDirectionalModel = (typeof DELIVERY_DIRECTIONAL_MODELS)[number];

/**
 * Modèles qui peuvent apparaître plusieurs fois dans une même livraison :
 * leur description les distingue (ex. deux modèles particuliers différents).
 */
export const REPEATABLE_FRAME_MODELS: readonly string[] = ['custom'];
export const REPEATABLE_ADDONS: readonly string[] = ['customNoMention', 'other'];
export const REPEATABLE_DIRECTIONAL_MODELS: readonly string[] = ['custom'];

export const DELIVERY_LIMITS = {
  frameModels: 5,
  frameQuantity: 20,
  addonModels: 5,
  addonQuantity: 20,
  keyboxQuantity: 3,
  directionalModels: 3,
  directionalQuantity: 5,
  otherItems: 3,
  otherQuantity: 10,
} as const;

export const DELIVERY_TEXT_LIMITS = {
  /** Description d'un modèle particulier (pancarte, directionnelle) : comme à l'installation */
  customModel: 100,
  addonMention: 50,
  customAddonModel: 50,
  otherDescription: 50,
} as const;