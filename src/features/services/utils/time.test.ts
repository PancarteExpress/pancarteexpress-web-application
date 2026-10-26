import { describe, expect, it } from 'vitest';
import { addMinutesClamped, isValidIsoDate, isValidTime } from './time';

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

  it('ajoute des minutes sans dépasser 23:55', () => {
    expect(addMinutesClamped('09:00', 120)).toBe('11:00');
    expect(addMinutesClamped('22:30', 120)).toBe('23:55');
  });
});