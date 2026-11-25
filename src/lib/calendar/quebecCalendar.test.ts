
import { describe, expect, it } from 'vitest';
import { isQuebecHoliday, nextBusinessDay, removalDateAfter } from './quebecCalendar';
 
describe('isQuebecHoliday', () => {
  it.each([
    '2026-01-01', // Jour de l'An
    '2026-04-06', // Lundi de Pâques
    '2026-05-18', // Patriotes
    '2026-06-24', // Fête nationale
    '2026-07-01', // Fête du Canada
    '2026-09-07', // Fête du Travail
    '2026-10-12', // Action de grâce
    '2026-12-25', // Noël
  ])('%s est férié', (d) => expect(isQuebecHoliday(d)).toBe(true));
 
  it('Fête nationale un dimanche → chômée le lundi', () => {
    expect(isQuebecHoliday('2029-06-25')).toBe(true);
  });

  it('Vendredi saint travaillé (seul le lundi de Pâques est chômé)', () => {
    expect(isQuebecHoliday('2026-04-03')).toBe(false);
  });
 
  it('lendemain de Noël non chômé', () => {
    expect(isQuebecHoliday('2026-12-26')).toBe(false);
  });
});
 
describe('nextBusinessDay', () => {
  it('jeudi saint → Vendredi saint (travaillé)', () => {
    expect(nextBusinessDay('2026-04-02')).toBe('2026-04-03');
  });

  it('Vendredi saint → mardi (fin de semaine et lundi de Pâques sautés)', () => {
    expect(nextBusinessDay('2026-04-03')).toBe('2026-04-07');
  });
});
 
describe('removalDateAfter', () => {
  it('vendredi → lundi suivant', () => expect(removalDateAfter(['2026-11-20'])).toBe('2026-11-23'));
  it('lundi de Pâques → mardi', () => expect(removalDateAfter(['2026-04-04'])).toBe('2026-04-07'));
  it('sans date → null', () => expect(removalDateAfter([])).toBeNull());
});
 