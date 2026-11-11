export const SERVICE_CHOICES = ['installation', 'removal', 'correction', 'delivery', 'pickup'] as const;
export type ServiceType = (typeof SERVICE_CHOICES)[number];
export const IMPLEMENTED_SERVICES = ['installation', 'removal', 'correction', 'pickup', 'delivery'] as const satisfies readonly ServiceType[];

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
  flagPlacement: 50,
  otherNeeds: 250,
} as const;

export const FRAME_MODELS = ['regular', 'prestige', 'custom'] as const;
export type FrameModelType = (typeof FRAME_MODELS)[number];

export const KIT_MODELS = [
  'shortPost36', 'longPost48', 'colonialWhite', 'colonialBlack',
  'aluminumWhite', 'aluminumBlack', 'aluminumEngelVolkers', 'custom',
] as const;
export type KitModelType = (typeof KIT_MODELS)[number];

export const LOCATIONS = ['ground', 'ramp', 'window', 'wall', 'balcony', 'other'] as const;
export type Location = (typeof LOCATIONS)[number];

export const WINDOW_SIDES = ['interior', 'exterior'] as const;
export type WindowSide = (typeof WINDOW_SIDES)[number];

export const LADDERS = ['noLadder', 'smallLadder', 'bigLadder'] as const;
export type Ladder = (typeof LADDERS)[number];
// Libellés français du courriel interne grand format (LARGE_ACCESS_LABELS) ; l'interface passe par i18n (services.access)
export const LADDER_LABELS: Record<Ladder, string> = {
  noLadder: "Pas besoin d'échelle",
  smallLadder: 'Échelle entre 6 à 12 pieds',
  bigLadder: 'Échelle entre 13 à 24 pieds',
};

/** Choix d'accès : les échelles + le rendez-vous (clôture/balcon seulement). */
export const ACCESS_CHOICES = [...LADDERS, 'phoneAppointment', 'keybox'] as const;
export type AccessChoice = (typeof ACCESS_CHOICES)[number];

export const MOUNTINGS = ['vShapeDrilled', 'flatDoubleTape'] as const;
export type Mounting = (typeof MOUNTINGS)[number];

// Ordre identique à la grille de la maquette (4 colonnes)
export const ADDONS = [
  'forSale', 'customNoMention', 'duplex', 'land',
  'sold', 'groundFloor', 'triplex', 'waterfront',
  'forRent', 'secondFloor', 'quadruplex', 'condo',
  'rented', 'thirdFloor', 'plex', 'other',
] as const;
export type Addon = (typeof ADDONS)[number];

export const ADDONS_WITH_MODEL = ['sold'] as const satisfies readonly Addon[];
export type AddonWithModel = (typeof ADDONS_WITH_MODEL)[number];

/** Mentions des drapeaux et directionnelles */
export const SIGN_MENTIONS = ['forSale', 'sold', 'forRent'] as const;
export type SignMention = (typeof SIGN_MENTIONS)[number];
export const FLAG_MENTIONS = ['forSale', 'sold', 'other'] as const;
export type FlagMention = (typeof FLAG_MENTIONS)[number];
