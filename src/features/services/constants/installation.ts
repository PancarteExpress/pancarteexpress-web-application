export const SERVICE_TYPES = ['installation', 'removal', 'correction', 'delivery', 'pickup'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];
export const SERVICE_LABELS: Record<ServiceType, string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
  delivery: 'Livraison de matériel',
  pickup: 'Ramassage de matériel',
};
export const IMPLEMENTED_SERVICES = ['installation', 'removal'] as const satisfies readonly ServiceType[];

export const ADDRESS_LABELS = {
  terrain: 'Terrain',
  near: 'près de',
  apartment: 'app.',
} as const;

export const MATERIALS = [
  'frames', 
  'kit', 
  'directional',
  'addons', 
  'openHouse', 
  'flags',
  'keybox', 
  'other',
] as const;
export type Material = (typeof MATERIALS)[number];
export const MATERIAL_LABELS: Record<Material, string> = {
  frames: 'Pancartes',
  kit: 'Kit d\'ancrage et de poteau',
  directional: 'Directionnelles',
  addons: 'Ajouts',
  openHouse: 'Visite libre',
  flags: 'Drapeaux',
  keybox: 'Boîtes à clés',
  other: 'Autres',
};

export const IMPLEMENTED_MATERIALS = MATERIALS;
export type ImplementedMaterial = (typeof IMPLEMENTED_MATERIALS)[number];

/** Inclus automatiquement (cochés et verrouillés) quand les pancartes sont sélectionnées. */
export const FRAME_BUNDLED_MATERIALS = ['kit'] as const satisfies readonly Material[];

export const MAX_FRAMES = 3;
export const MAX_KITS = 3;
export const MAX_ADDONS = 3;
export const MAX_FLAGS = 2;
export const MAX_DIRECTIONALS = 3;
export const KEYBOX_CODE_MAX_DIGITS = 6;

export const OPEN_HOUSE = {
  maxDirectionals: 5,
  maxFlags: 2,
  maxDates: 2,
  defaultStartTime: '09:00',
  defaultDurationMinutes: 120,
} as const;

/** Pas des minutes dans les sélecteurs d'heure */
export const TIME_MINUTE_STEP = 15;

export const TEXT_LIMITS = {
  modelDescription: 100,
  displayName: 100,
  appointmentContact: 100,
  keyboxAccess: 30,
  placementDescription: 100,
  addonMention: 50,
  kitDescription: 50,
  directionalPlacement: 50,
  keyboxPlacement: 50,
  flagMention: 50,
  otherNeeds: 250,
} as const;

export const FRAME_MODELS = ['regular', 'prestige', 'custom'] as const;
export type FrameModelType = (typeof FRAME_MODELS)[number];
export const FRAME_MODEL_LABELS: Record<FrameModelType, string> = {
  regular: 'Régulier',
  prestige: 'Prestige',
  custom: 'Modèle particulier',
};

export const KIT_MODELS = [
  'shortPost36', 'longPost48', 'colonialWhite', 'colonialBlack',
  'aluminumWhite', 'aluminumBlack', 'aluminumEngelVolkers', 'custom',
] as const;
export type KitModelType = (typeof KIT_MODELS)[number];
export const KIT_MODEL_LABELS: Record<KitModelType, string> = {
  shortPost36: 'Court 36"',
  longPost48: 'Long 48"',
  colonialWhite: 'Colonial blanc',
  colonialBlack: 'Colonial noir',
  aluminumWhite: 'Aluminium blanc',
  aluminumBlack: 'Aluminium noir',
  aluminumEngelVolkers: 'Aluminium Engel & Völkers',
  custom: 'Poteau spécifique',
};

export const LOCATIONS = ['ground', 'ramp', 'window', 'wall', 'balcony', 'other'] as const;
export type Location = (typeof LOCATIONS)[number];
export const LOCATION_LABELS: Record<Location, string> = {
  ground: 'Au sol',
  ramp: 'Rampe',
  window: 'Fenêtre',
  wall: 'Au mur',
  balcony: 'Balcon',
  other: 'Autres',
};

export const WINDOW_SIDES = ['interior', 'exterior'] as const;
export type WindowSide = (typeof WINDOW_SIDES)[number];
export const WINDOW_SIDE_LABELS: Record<WindowSide, string> = {
  interior: 'Intérieur',
  exterior: 'Extérieur',
};

export const LADDERS = ['noLadder', 'smallLadder', 'bigLadder'] as const;
export type Ladder = (typeof LADDERS)[number];
export const LADDER_LABELS: Record<Ladder, string> = {
  noLadder: "Pas besoin d'échelle",
  smallLadder: 'Échelle entre 6 à 12 pieds',
  bigLadder: 'Échelle entre 13 à 24 pieds',
};

/** Choix d'accès : les échelles + le rendez-vous (clôture/balcon seulement). */
export const ACCESS_CHOICES = [...LADDERS, 'phoneAppointment', 'keybox'] as const;
export type AccessChoice = (typeof ACCESS_CHOICES)[number];
export const ACCESS_LABELS: Record<AccessChoice, string> = {
  ...LADDER_LABELS,
  phoneAppointment: 'Par rendez-vous téléphonique',
  keybox: 'Via boîte à clés',
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
  customNoMention: 'Ajout personnalisé',
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

/** Mentions des drapeaux et directionnelles */
export const SIGN_MENTIONS = ['forSale', 'sold', 'forRent'] as const;
export type SignMention = (typeof SIGN_MENTIONS)[number];
export const SIGN_MENTION_LABELS: Record<SignMention, string> = {
  forSale: 'À vendre',
  sold: 'Vendu',
  forRent: 'À louer',
};
export const FLAG_MENTIONS = ['forSale', 'sold', 'other'] as const;
export type FlagMention = (typeof FLAG_MENTIONS)[number];
export const FLAG_MENTION_LABELS: Record<FlagMention, string> = {
  forSale: SIGN_MENTION_LABELS.forSale,
  sold: SIGN_MENTION_LABELS.sold,
  other: 'Autres',
};