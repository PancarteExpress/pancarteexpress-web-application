
import { addDays, format, parse } from 'date-fns';
import { isValidIsoDate } from '@/features/services/utils/time';
import * as calendar from '@/lib/calendar/quebecCalendar';
 
/**
 * Adaptateur Date ↔ "yyyy-MM-dd" pour les composants.
 * Les règles (jours fériés, jours ouvrables) vivent dans lib/calendar : même source qu'OptimoRoute.
 */
 
const ISO_FORMAT = 'yyyy-MM-dd';
const toIso = (d: Date) => format(d, ISO_FORMAT);
export const parseIso = (iso: string) => parse(iso, ISO_FORMAT, new Date());
 
/** Jours fériés du Québec pour une année, au format yyyy-MM-dd */
export const quebecHolidays = calendar.quebecHolidays;
 
export const isQuebecHoliday = (date: Date): boolean => calendar.isQuebecHoliday(toIso(date));
 
export const isBusinessDay = (date: Date): boolean => calendar.isBusinessDay(toIso(date));
 
/** Premier jour ouvrable à partir de `date` (incluse) */
export const firstBusinessDayFrom = (date: Date): Date => parseIso(calendar.firstBusinessDayFrom(toIso(date)));
 
/** Première date sélectionnable pour une « date précise » : le premier jour ouvrable après `today` */
export function earliestSpecificDate(today: Date): Date {
  return firstBusinessDayFrom(addDays(today, 1));
}
 
/** Date du jour à Montréal (yyyy-MM-dd), quel que soit le fuseau du serveur */
export const todayInMontreal = (now: Date = new Date()): Date => parseIso(calendar.todayInToronto(now));
 
/**
 * Vrai si `iso` peut encore être choisie comme « date précise » : jour ouvrable, au plus tôt le premier
 * jour ouvrable après aujourd'hui (Montréal). Même règle pour le formulaire, le panier et le checkout.
 */
export function isSelectableSpecificDate(iso: string, now: Date = new Date()): boolean {
  if (!isValidIsoDate(iso)) return false;
  const earliest = toIso(earliestSpecificDate(todayInMontreal(now)));
  return iso >= earliest && isBusinessDay(parseIso(iso));
}

/** Première date de réception du matériel à l'entrepôt : aujourd'hui (Montréal) si c'est un jour ouvrable, sinon le suivant */
export const earliestReceptionDate = (now: Date = new Date()): Date => firstBusinessDayFrom(todayInMontreal(now));

/**
 * Vrai si `iso` peut être choisie comme date de réception à l'entrepôt : jour ouvrable,
 * à partir d'aujourd'hui (Montréal). Même règle pour le formulaire et le serveur.
 */
export function isSelectableReceptionDate(iso: string, now: Date = new Date()): boolean {
  if (!isValidIsoDate(iso)) return false;
  const earliest = toIso(todayInMontreal(now));
  return iso >= earliest && isBusinessDay(parseIso(iso));
}