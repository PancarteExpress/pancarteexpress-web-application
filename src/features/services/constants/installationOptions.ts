
export const MATERIALS_OPTIONS = [
  { key: 'frames', label: 'Pancartes', dependencies: ['anchors', 'poles'] },
  { key: 'anchors', label: 'Ancrages', dependencies: [] },
  { key: 'poles', label: 'Poteaux', dependencies: [] },
  { key: 'addonsOpenHouse', label: 'Ajout visite libre', dependencies: [] },
  { key: 'addons', label: 'Ajout (autres)', dependencies: [] },
  { key: 'keybox', label: 'Boîte à clés', dependencies: [] },
  { key: 'flags', label: 'Drapeaux', dependencies: [] },
  { key: 'directional', label: 'Directionnelles', dependencies: [] },
  { key: 'other', label: 'Autres', dependencies: [] },
] as const;

export const ACCESS_OPTIONS = [
  { key: 'ground', label: 'Au sol' },
  { key: 'wall', label: 'Au mur' },
  { key: 'fence', label: 'Cloture' },
  { key: 'ramp', label: 'Rampe' },
  { key: 'balcony', label: 'Balcon' },
  { key: 'other', label: 'Autres' },
] as const;

export const SPECIAL_ACCESS_OPTIONS = [
  { key: 'noLadder', label: 'Pas besoin dechelle' },
  { key: 'smallLadder', label: 'Echelle entre 6 a 12 pieds' },
  { key: 'bigLadder', label: 'Echelle entre 13 a 24 pieds' },
  { key: 'appointment', label: 'Rendez-vous telephonique' },
] as const;