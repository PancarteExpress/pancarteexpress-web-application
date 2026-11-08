import type { ServiceDelay } from '@prisma/client';

export const SERVICE_DELAY_SHORT_LABELS: Record<ServiceDelay, string> = {
  standard24h: 'Standard 24 h',
  urgent12h: 'Urgence 12 h',
  sameDay: 'Urgence jour même',
  specificDate: 'Date précise',
};

/** 'yyyy-MM-dd' → minuit UTC, comme en base (@db.Date) */
export const isoToUtcDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** Date d'une colonne @db.Date, au bon jour quel que soit le fuseau d'affichage */
export const formatServiceDate = (date: Date, locale: string = 'fr-CA'): string =>
  date.toLocaleDateString(locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Ex. « Urgence 12 h » ou « Le mardi 13 octobre 2026 » ; null = grand format, sans délai */
export function formatServiceDelay(delay: ServiceDelay | null, requestedDate: Date | null): string {
  if (delay === null) return 'Aucun délai (grand format)';
  return delay === 'specificDate' && requestedDate
    ? `Le ${formatServiceDate(requestedDate)}`
    : SERVICE_DELAY_SHORT_LABELS[delay];
}