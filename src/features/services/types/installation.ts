import type {
  Addon, FlagMention, KitModelType, Ladder, Mounting, SignMention, WindowSide,
} from '../constants/installation';

/** Accès commun au balcon et à la fenêtre */
export type PlacementAccess =
  | { type: 'ladder'; ladder: Ladder }
  | { type: 'phoneAppointment'; contact: string }
  | { type: 'keybox'; info: string };

export type Placement =
  | { location: 'ground' | 'ramp' }
  | { location: 'wall'; ladder: Ladder; mounting: Mounting }
  | { location: 'balcony'; access: PlacementAccess }
  | { location: 'window'; access: PlacementAccess; side: WindowSide }
  | { location: 'other'; description: string };

export type FrameModel =
  | { type: 'regular' }
  | { type: 'prestige' }
  | { type: 'custom'; description: string };

export type FrameDisplayName =
  | { type: 'account'; name: string }
  | { type: 'custom'; names: string };

export interface FrameUnit {
  uid: string;
  model: FrameModel | null;
  displayName: FrameDisplayName | null;
}

export interface FramesDetails {
  /** null = membre, ou ramassage non requis */
  pickupAddress: string | null;
  units: FrameUnit[];
}

/** Répartition d'unités entre les pancartes de la demande et une pancarte déjà sur place */
export interface UnitTargets {
  quantity: number;
  /** Pancartes de la demande qui reçoivent une unité (max 1 unité par pancarte) */
  frameUids: string[];
  /** Unités restantes destinées à une pancarte déjà sur place */
  onSiteCount: number;
}

export type AddonAssignment = UnitTargets &
  ({ addon: Exclude<Addon, 'other'> } | { addon: 'other'; mention: string });

export type KitModel =
  | { type: Exclude<KitModelType, 'custom'> }
  | { type: 'custom'; description: string };

export interface KitUnit {
  uid: string;
  model: KitModel;
}

/** Kit commandé seul (sans pancarte). Avec des pancartes, le kit est inclus et n'a pas de détails. */
export interface KitsDetails {
  units: KitUnit[];
}

export interface KeyboxDetails {
  /** Un seul code pour toutes les boîtes */
  code: string;
  units: PlacedUnit[];
}

export interface FlagsDetails {
  mention: FlagMention;
  quantity: number;
}

export interface DirectionalsDetails {
  mention: SignMention;
  units: PlacedUnit[];
}

export interface InstallationDetails {
  placement: Placement;
  frames: FramesDetails | null;
  kits: KitsDetails | null;
  addons: AddonAssignment[] | null;
  openHouse: OpenHouseDetails | null;
  keybox: KeyboxDetails | null;
  flags: FlagsDetails | null;
  directionals: DirectionalsDetails | null;
  otherNeeds: string | null;
}

/** Unité dont seul l'emplacement est précisé (directionnelle, boîte à clés) */
export interface PlacedUnit {
  uid: string;
  placement: string;
}

export type OpenHouseDirectional = PlacedUnit;

/** Visite libre : une date et une plage horaire pour toutes les affichettes */
export interface OpenHouseDetails extends UnitTargets {
  /** Date locale, format yyyy-MM-dd (sans fuseau horaire) */
  date: string;
  /** Heures locales en 24 h, format HH:mm */
  startTime: string;
  endTime: string;
  directionals: OpenHouseDirectional[];
  flagCount: number;
  removeNextMonday: boolean;
}

