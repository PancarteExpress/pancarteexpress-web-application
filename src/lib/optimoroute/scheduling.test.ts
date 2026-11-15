
import { describe, expect, it } from 'vitest';
import { computeSchedule } from './scheduling';
 
// Midi à Montréal (UTC-5 en hiver, UTC-4 en été)
const at = (iso: string, offset = '-05:00') => new Date(`${iso}T12:00:00${offset}`);
 
describe('computeSchedule', () => {
  it('standard un vendredi → lundi', () => {
    expect(computeSchedule('standard24h', null, at('2026-11-06'))).toEqual({ date: '2026-11-09', priority: 'M' });
  });
  it('standard la veille de Noël → saute Noël et la fin de semaine', () => {
    expect(computeSchedule('standard24h', null, at('2026-12-24'))).toEqual({ date: '2026-12-28', priority: 'M' });
  });
  it('urgent12h → priorité H', () => {
    expect(computeSchedule('urgent12h', null, at('2026-11-05')).priority).toBe('H');
  });
  it('sameDay vendredi → jour même', () => {
    expect(computeSchedule('sameDay', null, at('2026-11-06')).date).toBe('2026-11-06');
  });
  it('sameDay samedi → lundi', () => {
    expect(computeSchedule('sameDay', null, at('2026-11-07')).date).toBe('2026-11-09');
  });
  it('specificDate fériée → prochain jour ouvrable', () => {
    expect(computeSchedule('specificDate', '2026-06-24', at('2026-06-01', '-04:00')).date).toBe('2026-06-25');
  });
  it('utilise la date de Montréal, pas UTC (23 h à Montréal = lendemain en UTC)', () => {
    const lateThursday = new Date('2026-11-05T23:30:00-05:00');
    expect(computeSchedule('standard24h', null, lateThursday).date).toBe('2026-11-06');
  });
});
 