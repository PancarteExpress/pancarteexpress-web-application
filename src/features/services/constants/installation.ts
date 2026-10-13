export const SERVICE_TYPES = ['installation', 'removal', 'correction', 'delivery', 'pickup'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];
export const SERVICE_LABELS: Record<ServiceType, string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
  delivery: 'Livraison de matériel',
  pickup: 'Ramassage de matériel',
};
export const IMPLEMENTED_SERVICES = ['installation'] as const satisfies readonly ServiceType[];

export const ADDRESS_LABELS = {
  terrain: 'Terrain',
  near: 'près de',
  apartment: 'app.',
} as const;

export const MATERIALS = [
  'frames', 'anchors', 'poles',
  'addons', 'openHouse', 'flags',
  'keybox', 'directional', 'other',
] as const;
export type Material = (typeof MATERIALS)[number];
export const MATERIAL_LABELS: Record<Material, string> = {
  frames: 'Pancartes',
  anchors: 'Ancrages',
  poles: 'Poteaux',
  addons: 'Ajout (autres) – seulement',
  openHouse: 'Visite libre – seulement',
  flags: 'Drapeaux (À vendre / Vendu)',
  keybox: 'Boîtes à clés',
  directional: 'Directionnelles (À vendre / Vendu)',
  other: 'Autres',
};
export const IMPLEMENTED_MATERIALS = ['frames', 'addons'] as const satisfies readonly Material[];
export type ImplementedMaterial = (typeof IMPLEMENTED_MATERIALS)[number];

/** Inclus automatiquement (cochés et verrouillés) quand les pancartes sont sélectionnées. */
export const FRAME_BUNDLED_MATERIALS = ['anchors', 'poles'] as const satisfies readonly Material[];

export const MAX_FRAMES = 3;
export const MAX_ADDONS = 3;

export const TEXT_LIMITS = {
  modelDescription: 100,
  displayName: 100,
  appointmentContact: 100,
  placementDescription: 100,
  addonMention: 50,
} as const;

export const FRAME_MODELS = ['regular', 'prestige', 'custom'] as const;
export type FrameModelType = (typeof FRAME_MODELS)[number];
export const FRAME_MODEL_LABELS: Record<FrameModelType, string> = {
  regular: 'Régulier',
  prestige: 'Prestige',
  custom: 'Modèle particulier',
};

export const LOCATIONS = ['ground', 'ramp', 'fence', 'wall', 'balcony', 'other'] as const;
export type Location = (typeof LOCATIONS)[number];
export const LOCATION_LABELS: Record<Location, string> = {
  ground: 'Au sol',
  ramp: 'Rampe',
  fence: 'Clôture',
  wall: 'Au mur',
  balcony: 'Balcon',
  other: 'Autres',
};

export const LADDERS = ['noLadder', 'smallLadder', 'bigLadder'] as const;
export type Ladder = (typeof LADDERS)[number];
export const LADDER_LABELS: Record<Ladder, string> = {
  noLadder: "Pas besoin d'échelle",
  smallLadder: 'Échelle entre 6 à 12 pieds',
  bigLadder: 'Échelle entre 13 à 24 pieds',
};

/** Choix d'accès : les échelles + le rendez-vous (clôture/balcon seulement). */
export const ACCESS_CHOICES = [...LADDERS, 'phoneAppointment'] as const;
export type AccessChoice = (typeof ACCESS_CHOICES)[number];
export const ACCESS_LABELS: Record<AccessChoice, string> = {
  ...LADDER_LABELS,
  phoneAppointment: 'Par rendez-vous téléphonique',
};

export const MOUNTINGS = ['vShapeDrilled', 'flatDoubleTape'] as const;
export type Mounting = (typeof MOUNTINGS)[number];
export const MOUNTING_LABELS: Record<Mounting, string> = {
  vShapeDrilled: 'En V avec perçage dans le mur',
  flatDoubleTape: 'À plat avec tape double face',
};

// Ordre identique à la grille de la maquette (4 colonnes)
export const ADDONS = [
  'forSale', 'customNoMention', 'duplex', 'land',
  'sold', 'groundFloor', 'triplex', 'waterfront',
  'forRent', 'secondFloor', 'quadruplex', 'condo',
  'rented', 'thirdFloor', 'plex', 'other',
] as const;
export type Addon = (typeof ADDONS)[number];
export const ADDON_LABELS: Record<Addon, string> = {
  forSale: 'À vendre',
  customNoMention: 'Ajout personnalisé (sans mention)',
  duplex: 'Duplex',
  land: 'Terrain',
  sold: 'Vendu',
  groundFloor: 'Rez-de-chaussée',
  triplex: 'Triplex',
  waterfront: "Bord de l'eau",
  forRent: 'À louer',
  secondFloor: '2e étage',
  quadruplex: 'Quadruplex',
  condo: 'Condo',
  rented: 'Loué',
  thirdFloor: '3e étage',
  plex: 'Plex',
  other: 'Autres',
};