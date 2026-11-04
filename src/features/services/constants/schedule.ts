import { SERVICE_DELAYS } from '@/lib/orders/constants';
export { SERVICE_DELAYS };
export type ServiceDelay = (typeof SERVICE_DELAYS)[number];

export const SERVICE_DELAY_LABELS: Record<ServiceDelay, string> = {
  standard24h: 'Standard 24 h*',
  urgent12h: 'Urgence 12 h (lendemain avant midi**)',
  sameDay: 'Urgence jour même (aujourd\'hui avant la fin de la journée**)',
  specificDate: 'Date précise',
};

export const SCHEDULE_NOTES = [
  '* En zone principale.',
  '** Confirmer par téléphone au 514-825-2709.',
] as const;