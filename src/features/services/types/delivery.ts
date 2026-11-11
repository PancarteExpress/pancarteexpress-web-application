import type { DeliveryAddon, DeliveryDirectionalModel } from '../constants/delivery';
import type { FrameModelType } from '../constants/installation';

/** Modèle choisi ; « custom » porte sa description */
type Model<T extends string> =
  | { model: Exclude<T, 'custom'> }
  | { model: 'custom'; description: string };

export type DeliveryFrame = Model<FrameModelType> & {
  quantity: number;
  /** Livrer aussi les ancrages et poteaux de ce modèle */
  withAnchorsAndPoles: boolean;
};

export type DeliveryAddonItem = { quantity: number } & (
  | { addon: Exclude<DeliveryAddon, 'other' | 'customNoMention'> }
  | { addon: 'other'; mention: string }
  /** Modèle de l'ajout personnalisé : facultatif */
  | { addon: 'customNoMention'; model: string | null }
);

export type DeliveryDirectional = Model<DeliveryDirectionalModel> & {
  quantity: number;
  /** Livrer aussi les poteaux de ce modèle */
  withPoles: boolean;
};

export interface DeliveryOtherItem {
  description: string;
  quantity: number;
}

export interface DeliveryDetails {
  frames: DeliveryFrame[] | null;
  addons: DeliveryAddonItem[] | null;
  keybox: { quantity: number; code: string | null } | null;
  directionals: DeliveryDirectional[] | null;
  others: DeliveryOtherItem[] | null;
}