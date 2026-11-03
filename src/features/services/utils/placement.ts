import {
  LADDER_LABELS, LOCATION_LABELS, MOUNTING_LABELS, WINDOW_SIDE_LABELS,
} from '@/features/services/constants/installation';
import type { Placement, PlacementAccess } from '@/features/services/types/installation';

function describeAccess(a: PlacementAccess): string {
  switch (a.type) {
    case 'ladder':
      return LADDER_LABELS[a.ladder];
    case 'phoneAppointment':
      return `Rendez-vous téléphonique : ${a.contact}`;
    case 'keybox':
      return `Boîte à clés : ${a.info}`;
  }
}

export function describePlacement(p: Placement): string {
  const location = LOCATION_LABELS[p.location];
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return location;
    case 'wall':
      return `${location} — ${LADDER_LABELS[p.ladder]}, ${MOUNTING_LABELS[p.mounting]}`;
    case 'balcony':
      return `${location} — ${describeAccess(p.access)}`;
    case 'window':
      return `${location} (${WINDOW_SIDE_LABELS[p.side].toLowerCase()}) — ${describeAccess(p.access)}`;
    case 'other':
      return `${location} — ${p.description}`;
  }
}
