import type { CorrectionDetails } from '@/features/services/types/correction';
import { upper } from './installationNotes';

/**
 * Correction dans les notes OptimoRoute :
 * - redressage : REDRESSER {COMPTE}
 * - explication : CORRECTION {COMPTE} [explication telle que saisie, sur une seule ligne]
 */
export function buildCorrectionNotes(details: CorrectionDetails, accountName: string | null): string {
  const name = accountName ? ` ${upper(accountName)}` : '';
  if (details.kind === 'straighten') return `REDRESSER${name}`;
  // Une explication sur plusieurs lignes est remise sur une seule, pour ne pas couper la note
  const explanation = details.explanation.replace(/\s*\n\s*/g, ' ').trim();
  return `CORRECTION${name}${explanation ? ` [${explanation}]` : ''}`;
}
