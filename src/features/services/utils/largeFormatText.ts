import {
  ACQUISITION_LABELS, LARGE_ACCESS_LABELS, LARGE_FORMAT_SERVICE_LABELS, LARGE_LOCATION_LABELS,
  STORAGE_PICKUP_MATERIAL_LABELS, STRUCTURE_LABELS, STRUCTURE_STYLE_LABELS,
} from '../constants/largeFormat';
import type {
  LargeInstallationDetails, LargePlacement, LargeRetrievalDetails, LargeStoragePickupDetails, StructureChoice,
} from '../types/largeFormat';
import type { LargeFormatService } from '../types/services';

/*
 * Texte des services grand format, en français.
 * Partagé par le résumé du formulaire et le courriel interne : ces demandes ne passent pas
 * par OptimoRoute, le courriel est donc la seule trace détaillée pour l'équipe.
 */

const describePlacement = (p: LargePlacement): string =>
  p.location === 'wall'
    ? `${LARGE_LOCATION_LABELS.wall} — accès : ${LARGE_ACCESS_LABELS[p.access].toLowerCase()}`
    : LARGE_LOCATION_LABELS.ground;

const describePaint = (color: string | null): string => (color ? `peinture : ${color}` : 'sans peinture');

function describeStructure(s: StructureChoice): string {
  const label = STRUCTURE_LABELS[s.structure];
  switch (s.structure) {
    case 'aluminumFramd':
    case 'signageFramd':
      // « Oui » seul serait ambigu hors du formulaire : on précise qu'il s'agit de la location
      return `${label} — ${s.acquisition === 'rent' ? 'location' : ACQUISITION_LABELS[s.acquisition].toLowerCase()}`;
    case 'woodFramd':
    case 'woodEasel':
      return `${label} — ${STRUCTURE_STYLE_LABELS[s.style].toLowerCase()}, ${describePaint(s.paintColor)}`;
  }
}

export function describeLargeInstallation(d: LargeInstallationDetails): string[] {
  const lines = [`Dimensions : ${d.dimensions}`, `Emplacement : ${describePlacement(d)}`];
  if (d.location === 'ground') lines.push(...d.structures.map((s) => `Structure : ${describeStructure(s)}`));
  return lines;
}

export const describeLargeStoragePickup = (d: LargeStoragePickupDetails): string[] => [
  `Matériel à ramasser : ${d.materials.map((m) => STORAGE_PICKUP_MATERIAL_LABELS[m]).join(', ')}`,
];

export const describeLargeRetrieval = (d: LargeRetrievalDetails): string[] => [
  `Endroit de la pancarte : ${describePlacement(d)}`,
];

/** Lignes de détail d'un service grand format (sans son titre) */
export function describeLargeFormatService(s: LargeFormatService): string[] {
  switch (s.type) {
    case 'largeInstallation':
      return describeLargeInstallation(s);
    case 'largeStoragePickup':
      return describeLargeStoragePickup(s);
    case 'largeRetrieval':
      return describeLargeRetrieval(s);
  }
}

export const largeFormatServiceTitle = (s: Pick<LargeFormatService, 'type'>): string =>
  LARGE_FORMAT_SERVICE_LABELS[s.type];
