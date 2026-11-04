import { describe, expect, it } from 'vitest';
import { correctionSchema, createEmptyCorrectionForm, toCorrectionFormValues } from './correction.schema';

const issuePaths = (result: ReturnType<typeof correctionSchema.safeParse>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

describe('correctionSchema', () => {
  it('exige un type de correction', () => {
    expect(issuePaths(correctionSchema.safeParse(createEmptyCorrectionForm()))).toEqual(['kind']);
  });

  it('redressage : aucune explication requise', () => {
    const result = correctionSchema.safeParse({ kind: 'straighten', explanation: '' });
    expect(result.success && result.data).toEqual({ kind: 'straighten' });
  });

  it('expliquer : explication obligatoire', () => {
    expect(issuePaths(correctionSchema.safeParse({ kind: 'explain', explanation: '   ' }))).toEqual(['explanation']);
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = correctionSchema.parse({ kind: 'explain', explanation: 'Pancarte tournée vers la maison' });
    expect(correctionSchema.parse(toCorrectionFormValues(first))).toEqual(first);
  });
});