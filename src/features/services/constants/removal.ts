export const REMOVAL_MATERIALS = ['frames', 'addons', 'keybox', 'flags', 'directional', 'other'] as const;
export type RemovalMaterial = (typeof REMOVAL_MATERIALS)[number];

export const REMOVAL_MATERIAL_LABELS: Record<RemovalMaterial, string> = {
  frames: 'Pancarte (incluant ajouts)',
  addons: 'Ajouts (sans la pancarte)',
  keybox: 'Boîtes à clés',
  flags: 'Drapeaux',
  directional: 'Directionnelles',
  other: 'Autres',
};

export const IMPLEMENTED_REMOVAL_MATERIALS = REMOVAL_MATERIALS;
export type ImplementedRemovalMaterial = (typeof IMPLEMENTED_REMOVAL_MATERIALS)[number];

/** Paires de matériels qui ne peuvent pas être retirés ensemble */
export const EXCLUSIVE_REMOVAL_MATERIALS: readonly (readonly [RemovalMaterial, RemovalMaterial])[] = [
  ['frames', 'addons'], // une pancarte retirée emporte ses ajouts
];

export const MAX_REMOVAL_FRAMES = 3;
export const MAX_REMOVAL_ADDONS = 3;
export const MAX_REMOVAL_KEYBOXES = 2;
export const MAX_REMOVAL_FLAGS = 2;
export const MAX_REMOVAL_DIRECTIONALS = 3;

export const REMOVAL_TEXT_LIMITS = {
  addonsDetails: 100,
  keyboxPlacement: 50,
  flagsPlacement: 50,
  directionalPlacement: 50,
  otherDetails: 100,
} as const;