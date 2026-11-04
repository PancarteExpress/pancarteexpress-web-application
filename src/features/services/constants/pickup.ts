export const PICKUP_MATERIALS = ['frames', 'anchors', 'poles', 'addons', 'keybox', 'directional', 'other'] as const;
export type PickupMaterial = (typeof PICKUP_MATERIALS)[number];

export const PICKUP_MATERIAL_LABELS: Record<PickupMaterial, string> = {
  frames: 'Pancartes',
  anchors: 'Ancrages',
  poles: 'Poteaux',
  addons: 'Ajouts',
  keybox: 'Boîtes à clés',
  directional: 'Directionnelles',
  other: 'Autres',
};

export const PICKUP_TEXT_LIMITS = {
  /** Limite large, invisible en usage normal : protège contre un collage accidentel */
  details: 2000,
} as const;