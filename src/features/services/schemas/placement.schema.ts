import { z } from 'zod';
import {
  ACCESS_CHOICES, LADDERS, LOCATIONS, MOUNTINGS, TEXT_LIMITS, WINDOW_SIDES,
  type AccessChoice, type Ladder,
} from '../constants/installation';
import type { Placement, PlacementAccess } from '../types/installation';
import { REQUIRED, defined, text, type Path, type Report } from './shared';

/* ---------- Forme du formulaire ---------- */

export const placementFormSchema = z.object({
  location: z.enum(LOCATIONS).nullable(),
  access: z.enum(ACCESS_CHOICES).nullable(),
  mounting: z.enum(MOUNTINGS).nullable(),
  windowSide: z.enum(WINDOW_SIDES).nullable(),
  contact: text(TEXT_LIMITS.appointmentContact),
  keyboxInfo: text(TEXT_LIMITS.keyboxAccess),
  description: text(TEXT_LIMITS.placementDescription),
});

export type PlacementFormValues = z.input<typeof placementFormSchema>;
type PlacementOutput = z.output<typeof placementFormSchema>;

export const createEmptyPlacement = (): PlacementFormValues => ({
  location: null, access: null, mounting: null, windowSide: null, contact: '', keyboxInfo: '', description: '',
});

/** Valeur initiale d'un nouvel emplacement : « Au sol » présélectionné */
export const createDefaultPlacement = (): PlacementFormValues => ({ ...createEmptyPlacement(), location: 'ground' });

const LADDER_SET: ReadonlySet<string> = new Set(LADDERS);
const isLadder = (a: AccessChoice): a is Ladder => LADDER_SET.has(a);

/* ---------- Validation ---------- */

function validateAccess(p: PlacementOutput, path: Path, report: Report) {
  if (p.access === null) report([...path, 'access'], REQUIRED);
  else if (p.access === 'phoneAppointment' && !p.contact) {
    report([...path, 'contact'], 'Indiquez vos coordonnées');
  } else if (p.access === 'keybox' && !p.keyboxInfo) {
    report([...path, 'keyboxInfo'], 'Indiquez les informations de la boîte à clés');
  }
}

export function validatePlacement(p: PlacementOutput, path: Path, report: Report) {
  if (p.location === null) return report([...path, 'location'], 'Choisissez un emplacement');

  switch (p.location) {
    case 'wall':
      if (p.access === null || !isLadder(p.access)) {
        report([...path, 'access'], "Choisissez une option d'échelle");
      }
      if (p.mounting === null) report([...path, 'mounting'], 'Choisissez une méthode de fixation');
      break;
    case 'balcony':
      validateAccess(p, path, report);
      break;
    case 'window':
      validateAccess(p, path, report);
      if (p.windowSide === null) report([...path, 'windowSide'], "Choisissez l'emplacement sur la fenêtre");
      break;
    case 'other':
      if (!p.description) report([...path, 'description'], "Décrivez l'emplacement");
      break;
  }
}

/* ---------- Formulaire → domaine ---------- */

function toAccess(p: PlacementOutput): PlacementAccess {
  const access = defined(p.access);
  if (access === 'phoneAppointment') return { type: 'phoneAppointment', contact: p.contact };
  if (access === 'keybox') return { type: 'keybox', info: p.keyboxInfo };
  return { type: 'ladder', ladder: access };
}

export function toPlacement(p: PlacementOutput): Placement {
  const location = defined(p.location);
  switch (location) {
    case 'ground':
    case 'ramp':
      return { location };
    case 'wall': {
      const access = defined(p.access);
      if (!isLadder(access)) throw new Error('Invariant violé : accès mural');
      return { location, ladder: access, mounting: defined(p.mounting) };
    }
    case 'balcony':
      return { location, access: toAccess(p) };
    case 'window':
      return { location, access: toAccess(p), side: defined(p.windowSide) };
    case 'other':
      return { location, description: p.description };
  }
}

/* ---------- Domaine → formulaire ---------- */

function fromAccess(a: PlacementAccess): Pick<PlacementFormValues, 'access' | 'contact' | 'keyboxInfo'> {
  switch (a.type) {
    case 'ladder':
      return { access: a.ladder, contact: '', keyboxInfo: '' };
    case 'phoneAppointment':
      return { access: 'phoneAppointment', contact: a.contact, keyboxInfo: '' };
    case 'keybox':
      return { access: 'keybox', contact: '', keyboxInfo: a.info };
  }
}

export function fromPlacement(p: Placement): PlacementFormValues {
  const empty = createEmptyPlacement();
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return { ...empty, location: p.location };
    case 'wall':
      return { ...empty, location: p.location, access: p.ladder, mounting: p.mounting };
    case 'balcony':
      return { ...empty, location: p.location, ...fromAccess(p.access) };
    case 'window':
      return { ...empty, location: p.location, windowSide: p.side, ...fromAccess(p.access) };
    case 'other':
      return { ...empty, location: p.location, description: p.description };
  }
}