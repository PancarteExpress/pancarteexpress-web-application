import { addDays, format, getDay, parse, subDays } from 'date-fns';

const ISO_FORMAT = 'yyyy-MM-dd';
const toIso = (d: Date) => format(d, ISO_FORMAT);
export const parseIso = (iso: string) => parse(iso, ISO_FORMAT, new Date());

const SUNDAY = 0;
const MONDAY = 1;
const SATURDAY = 6;

/** Dimanche de Pâques (algorithme grégorien anonyme, dit de Meeus) */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** n-ième lundi d'un mois (month0 : 0 = janvier) */
function nthMonday(year: number, month0: number, n: number): Date {
  const first = new Date(year, month0, 1);
  const offset = (MONDAY - getDay(first) + 7) % 7;
  return new Date(year, month0, 1 + offset + 7 * (n - 1));
}

/** Lundi strictement avant une date (ex. Journée des patriotes : lundi précédant le 25 mai) */
function mondayBefore(year: number, month0: number, day: number): Date {
  let d = subDays(new Date(year, month0, day), 1);
  while (getDay(d) !== MONDAY) d = subDays(d, 1);
  return d;
}

/** Fête tombant un dimanche : chômée le lundi */
const observedIfSunday = (d: Date) => (getDay(d) === SUNDAY ? addDays(d, 1) : d);

/** Jours fériés du Québec pour une année, au format yyyy-MM-dd */
export function quebecHolidays(year: number): ReadonlySet<string> {
  const easter = easterSunday(year);
  return new Set(
    [
      new Date(year, 0, 1),                      // Jour de l'An
      subDays(easter, 2),                        // Vendredi saint
      addDays(easter, 1),                        // Lundi de Pâques
      mondayBefore(year, 4, 25),                 // Journée nationale des patriotes
      observedIfSunday(new Date(year, 5, 24)),   // Fête nationale
      observedIfSunday(new Date(year, 6, 1)),    // Fête du Canada
      nthMonday(year, 8, 1),                     // Fête du Travail
      nthMonday(year, 9, 2),                     // Action de grâce
      new Date(year, 11, 25),                    // Noël
    ].map(toIso),
  );
}

// Calculé une fois par année consultée
const cache = new Map<number, ReadonlySet<string>>();

export function isQuebecHoliday(date: Date): boolean {
  const year = date.getFullYear();
  let holidays = cache.get(year);
  if (!holidays) {
    holidays = quebecHolidays(year);
    cache.set(year, holidays);
  }
  return holidays.has(toIso(date));
}

export function isBusinessDay(date: Date): boolean {
  const weekday = getDay(date);
  return weekday !== SUNDAY && weekday !== SATURDAY && !isQuebecHoliday(date);
}

/** Premier jour ouvrable à partir de `date` (incluse) */
export function firstBusinessDayFrom(date: Date): Date {
  let d = date;
  while (!isBusinessDay(d)) d = addDays(d, 1);
  return d;
}