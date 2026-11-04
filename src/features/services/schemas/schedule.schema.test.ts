import { describe, expect, it } from 'vitest';
import { createEmptyScheduleForm, createScheduleSchema, toScheduleFormValues } from './schedule.schema';

// Vendredi 9 octobre 2026 ; le lundi 12 est l'Action de grâce
const schema = createScheduleSchema({ today: new Date(2026, 9, 9) });

const issuePaths = (result: ReturnType<typeof schema.safeParse>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

const specific = (date: string | null) => ({ delay: 'specificDate' as const, date });

describe('createScheduleSchema', () => {
  it('Standard 24 h par défaut, sans date', () => {
    const result = schema.safeParse(createEmptyScheduleForm());
    expect(result.success && result.data).toEqual({ delay: 'standard24h' });
  });

  it('date précise : obligatoire', () => {
    expect(issuePaths(schema.safeParse(specific(null)))).toEqual(['date']);
  });

  it('refuse aujourd\'hui, une fin de semaine et un jour férié', () => {
    expect(issuePaths(schema.safeParse(specific('2026-10-09')))).toEqual(['date']); // aujourd'hui
    expect(issuePaths(schema.safeParse(specific('2026-10-10')))).toEqual(['date']); // samedi
    expect(issuePaths(schema.safeParse(specific('2026-10-12')))).toEqual(['date']); // Action de grâce
  });

  it('accepte le premier jour ouvrable suivant', () => {
    const result = schema.safeParse(specific('2026-10-13'));
    expect(result.success && result.data).toEqual({ delay: 'specificDate', date: '2026-10-13' });
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = schema.parse(specific('2026-10-14'));
    expect(schema.parse(toScheduleFormValues(first))).toEqual(first);
  });
});