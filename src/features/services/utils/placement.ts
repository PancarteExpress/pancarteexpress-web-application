import type { Placement, PlacementAccess } from '@/features/services/types/installation';

/** Traducteur du namespace « services » : useTranslations('services') */
export type ServicesTranslator = (key: string, values?: Record<string, string | number>) => string;

function describeAccess(a: PlacementAccess, t: ServicesTranslator): string {
  switch (a.type) {
    case 'ladder':
      return t(`access.${a.ladder}`);
    case 'phoneAppointment':
      return t('placement.phoneAppointmentText', { contact: a.contact });
    case 'keybox':
      return t('placement.keyboxText', { info: a.info });
  }
}

/** Texte d'un emplacement, dans la langue de l'interface */
export function describePlacement(p: Placement, t: ServicesTranslator): string {
  const location = t(`locations.${p.location}`);
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return location;
    case 'wall':
      // Fixation facultative au retrait : affichée seulement si elle est précisée
      return `${location} — ${t(`access.${p.ladder}`)}${p.mounting ? `, ${t(`mountings.${p.mounting}`)}` : ''}`;
    case 'balcony':
      return `${location} — ${describeAccess(p.access, t)}${p.mounting ? `, ${t(`balconyMountings.${p.mounting}`)}` : ''}`;
    case 'window':
      return `${location}${p.side ? ` (${t(`windowSides.${p.side}`).toLowerCase()})` : ''} — ${describeAccess(p.access, t)}`;
    case 'other':
      return `${location} — ${p.description}`;
  }
}
