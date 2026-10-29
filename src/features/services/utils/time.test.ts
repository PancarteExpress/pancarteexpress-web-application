import { describe, expect, it } from 'vitest';
import {
  addMinutesClamped, fromMinutes, isNextDay, isValidIsoDate, isValidTime, LATEST_TIME_MINUTES, removalDayAfter,
} from './time';

describe('time utils', () => {
  it('valide le format HH:mm en 24 h', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:00')).toBe(false);
  });

  it('valide une date réelle au format yyyy-MM-dd', () => {
    expect(isValidIsoDate('2026-10-24')).toBe(true);
    expect(isValidIsoDate('2026-02-31')).toBe(false);
    expect(isValidIsoDate('24/10/2026')).toBe(false);
  });

  it('ajoute des minutes sans dépasser la dernière heure sélectionnable', () => {
    expect(addMinutesClamped('09:00', 120)).toBe('11:00');
    expect(addMinutesClamped('22:30', 120)).toBe(fromMinutes(LATEST_TIME_MINUTES));
  });

  it('détecte le lendemain, y compris en changement de mois', () => {
    expect(isNextDay('2026-10-24', '2026-10-25')).toBe(true);
    expect(isNextDay('2026-10-31', '2026-11-01')).toBe(true);
    expect(isNextDay('2026-10-24', '2026-10-26')).toBe(false);
  });

  it('donne le jour du retrait : lundi suivant, ou jour ouvrable suivant si férié', () => {
    expect(removalDayAfter(['2026-10-24'])).toBe('2026-10-26');               // samedi → lundi
    expect(removalDayAfter(['2026-10-25', '2026-10-24'])).toBe('2026-10-26'); // ordre indifférent
    expect(removalDayAfter(['2026-10-26'])).toBe('2026-11-02');               // lundi → lundi suivant
    expect(removalDayAfter(['2026-10-10', '2026-10-11'])).toBe('2026-10-13'); // Action de grâce → mardi
    expect(removalDayAfter(['2028-12-23', '2028-12-24'])).toBe('2028-12-26'); // Noël un lundi → mardi
    expect(removalDayAfter([])).toBeNull();
  });
});