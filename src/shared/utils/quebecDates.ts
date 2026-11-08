const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Pâques (algorithme de Meeus/Jones/Butcher)
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-12
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// n-ième jour de la semaine (0 = dimanche, 1 = lundi) d'un mois (0-indexé)
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

// Journée des patriotes : lundi précédant le 25 mai
function patriotesDay(year: number): Date {
  const may25 = new Date(year, 4, 25);
  const daysBack = (may25.getDay() - 1 + 7) % 7 || 7; // si le 25 est un lundi, on prend le lundi d'avant
  return new Date(year, 4, 25 - daysBack);
}

function getQuebecHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  return new Set(
    [
      new Date(year, 0, 1),          // Jour de l'an
      goodFriday,                    // Vendredi saint
      easterMonday,                  // Lundi de Pâques
      patriotesDay(year),            // Journée nationale des patriotes
      new Date(year, 5, 24),         // Fête nationale du Québec
      new Date(year, 6, 1),          // Fête du Canada
      nthWeekday(year, 8, 1, 1),     // Fête du Travail
      nthWeekday(year, 9, 1, 2),     // Action de grâce
      new Date(year, 11, 25),        // Noël
    ].map(toIso)
  );
}

export function isValidReceptionDate(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return false;

  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  if (day === 0 || day === 6) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return false;

  return !getQuebecHolidays(y).has(isoDate);
}

// Pour l'attribut min du champ date (date locale, pas UTC)
export function minReceptionDate(): string {
  return toIso(new Date());
}