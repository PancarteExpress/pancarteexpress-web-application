import { describe, expect, it } from 'vitest';
import { buildCorrectionNotes } from './correctionNotes';

describe('buildCorrectionNotes', () => {
  it('redressage : REDRESSER {COMPTE}', () => {
    expect(buildCorrectionNotes({ kind: 'straighten' }, 'Cristian Fermin Lopez')).toBe('REDRESSER CRISTIAN FERMIN LOPEZ');
  });

  it('explication : CORRECTION {COMPTE} [texte]', () => {
    expect(buildCorrectionNotes(
      { kind: 'explain', explanation: 'Ma pancarte a été dévorée par un lapin. Merci de la remplacer.' },
      'Cristian Fermin Lopez',
    )).toBe('CORRECTION CRISTIAN FERMIN LOPEZ [Ma pancarte a été dévorée par un lapin. Merci de la remplacer.]');
  });

  it('explication sur plusieurs lignes : une seule ligne, sans compte pour un invité', () => {
    expect(buildCorrectionNotes({ kind: 'explain', explanation: 'Ligne 1\n\n  Ligne 2' }, null)).toBe('CORRECTION [Ligne 1 Ligne 2]');
  });
});
