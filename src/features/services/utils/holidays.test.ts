import { describe, expect, it } from 'vitest';
import { firstBusinessDayFrom, isQuebecHoliday, quebecHolidays } from './holidays';
import { format } from 'date-fns';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const iso = (date: Date) => format(date, 'yyyy-MM-dd');

describe('jours fériés du Québec', () => {
  it('calcule les fêtes mobiles de 2026', () => {
    const h = quebecHolidays(2026);
    expect(h.has('2026-04-03')).toBe(true); // Vendredi saint
    expect(h.has('2026-04-06')).toBe(true); // Lundi de Pâques
    expect(h.has('2026-05-18')).toBe(true); // Patriotes (25 mai est un lundi → lundi précédent)
    expect(h.has('2026-09-07')).toBe(true); // Fête du Travail
    expect(h.has('2026-10-12')).toBe(true); // Action de grâce
  });

  it('reporte la Fête du Canada au lundi quand elle tombe un dimanche', () => {
    expect(isQuebecHoliday(d(2029, 7, 2))).toBe(true);
  });

  it('cherche le premier jour ouvrable', () => {
    expect(iso(firstBusinessDayFrom(d(2026, 10, 12)))).toBe('2026-10-13'); // Action de grâce → mardi
    expect(iso(firstBusinessDayFrom(d(2026, 10, 26)))).toBe('2026-10-26'); // lundi ordinaire
  });
});