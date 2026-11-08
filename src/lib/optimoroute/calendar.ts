/** Date civile "YYYY-MM-DD", sans heure ni fuseau. */
export type IsoDate = string;

const TIME_ZONE = 'America/Toronto';
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const torontoFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Date du jour au Québec, quel que soit le fuseau du serveur (Vercel = UTC). */
export function todayInToronto(now: Date = new Date()): IsoDate {
  return torontoFormatter.format(now);
}

function toUtcDate(iso: IsoDate): Date {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Date invalide : ${iso}`);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function fromUtcDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

function ymd(year: number, month: number, day: number): IsoDate {
  return fromUtcDate(new Date(Date.UTC(year, month - 1, day)));
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

/** 1 = lundi … 7 = dimanche (ISO 8601). */
export function isoWeekday(iso: IsoDate): number {
  const day = toUtcDate(iso).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Dimanche de Pâques (algorithme de Meeus/Butcher). */
function easterSunday(year: number): IsoDate {
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
  return ymd(year, month, day);
}

/** n-ième jour de semaine (1 = lundi … 7 = dimanche) d'un mois. */
function nthWeekday(year: number, month: number, weekday: number, n: number): IsoDate {
  const first = ymd(year, month, 1);
  const offset = (weekday - isoWeekday(first) + 7) % 7;
  return addDays(first, offset + (n - 1) * 7);
}

/** Jours fériés chômés au Québec (Loi sur les normes du travail). */
function computeQuebecHolidays(year: number): Set<IsoDate> {
  const may24 = ymd(year, 5, 24);
  const canadaDay = ymd(year, 7, 1);

  return new Set<IsoDate>([
    ymd(year, 1, 1), // Jour de l'an
    addDays(easterSunday(year), -2), // Vendredi saint
    addDays(may24, -(isoWeekday(may24) - 1)), // Journée nationale des patriotes
    ymd(year, 6, 24), // Fête nationale
    isoWeekday(canadaDay) === 7 ? ymd(year, 7, 2) : canadaDay, // Fête du Canada
    nthWeekday(year, 9, 1, 1), // Fête du Travail
    nthWeekday(year, 10, 1, 2), // Action de grâce
    ymd(year, 12, 25), // Noël
  ]);
}

const holidayCache = new Map<number, Set<IsoDate>>();

export function isQuebecHoliday(iso: IsoDate): boolean {
  const year = toUtcDate(iso).getUTCFullYear();
  let holidays = holidayCache.get(year);
  if (!holidays) {
    holidays = computeQuebecHolidays(year);
    holidayCache.set(year, holidays);
  }
  return holidays.has(iso);
}

export function isBusinessDay(iso: IsoDate): boolean {
  return isoWeekday(iso) <= 5 && !isQuebecHoliday(iso);
}
