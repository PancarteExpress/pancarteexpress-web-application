import { LADDER_LABELS } from './installation';

/* ---------- Services ---------- */

export const LARGE_FORMAT_SERVICES = ['largeInstallation', 'largeStoragePickup', 'largeRetrieval'] as const;
export type LargeFormatServiceType = (typeof LARGE_FORMAT_SERVICES)[number];

export const LARGE_FORMAT_SERVICE_LABELS: Record<LargeFormatServiceType, string> = {
  largeInstallation: 'Installer une pancarte/structure',
  largeStoragePickup: 'Ramasser du nouveau matériel pour entreposage',
  largeRetrieval: 'Récupérer une pancarte/structure',
};

/* ---------- Emplacement et accès ---------- */

export const LARGE_LOCATIONS = ['ground', 'wall'] as const;
export type LargeLocation = (typeof LARGE_LOCATIONS)[number];
export const LARGE_LOCATION_LABELS: Record<LargeLocation, string> = { ground: 'Au sol', wall: 'Au mur' };

export const LARGE_ACCESS = ['noLadder', 'smallLadder', 'bigLadder', 'boomLift'] as const;
export type LargeAccess = (typeof LARGE_ACCESS)[number];
export const LARGE_ACCESS_LABELS: Record<LargeAccess, string> = {
  ...LADDER_LABELS,
  boomLift: 'Nacelle jusqu\'à 35 pieds',
};

/* ---------- Structures (installation au sol) ---------- */

export const STRUCTURES = ['aluminumFramd', 'woodFramd', 'signageFramd', 'woodEasel'] as const;
export type Structure = (typeof STRUCTURES)[number];
export const STRUCTURE_LABELS: Record<Structure, string> = {
  aluminumFramd: 'Structure en aluminium FRAMD',
  woodFramd: 'Structure en bois FRAMD',
  signageFramd: 'Structure signalétique FRAMD',
  woodEasel: 'Structure en bois « Chevalet »',
};

/** Structures louables : on demande si le client la loue, la possède ou l'achète */
export const ACQUISITIONS = ['rent', 'owned', 'buy'] as const;
export type Acquisition = (typeof ACQUISITIONS)[number];
export const ACQUISITION_LABELS: Record<Acquisition, string> = {
  rent: 'Oui',
  owned: 'Non, je possède déjà la structure',
  buy: 'Non, je souhaite en acheter une',
};

export const WOOD_FRAMD_STYLES = ['recto', 'rectoVerso', 'vShape'] as const;
export type WoodFramdStyle = (typeof WOOD_FRAMD_STYLES)[number];
export const EASEL_STYLES = ['recto', 'rectoVerso'] as const satisfies readonly WoodFramdStyle[];
export type EaselStyle = (typeof EASEL_STYLES)[number];
export const STRUCTURE_STYLE_LABELS: Record<WoodFramdStyle, string> = {
  recto: 'Recto',
  rectoVerso: 'Recto-verso',
  vShape: 'En V',
};

/* ---------- Ramassage pour entreposage ---------- */

export const STORAGE_PICKUP_MATERIALS = ['largeSigns', 'commercialAddons'] as const;
export type StoragePickupMaterial = (typeof STORAGE_PICKUP_MATERIALS)[number];
export const STORAGE_PICKUP_MATERIAL_LABELS: Record<StoragePickupMaterial, string> = {
  largeSigns: 'Pancartes grands formats',
  commercialAddons: 'Ajouts commerciaux',
};

export const LARGE_TEXT_LIMITS = {
  dimensions: 200,
  paintColor: 50,
} as const;