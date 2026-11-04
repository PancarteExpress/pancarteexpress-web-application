import * as z from 'zod';
import { CORRECTION_KINDS, CORRECTION_TEXT_LIMITS } from '../constants/correction';
import type { CorrectionDetails } from '../types/correction';
import { defined, text, type Report } from './shared';

const correctionFormSchema = z.object({
  kind: z.enum(CORRECTION_KINDS).nullable(),
  explanation: text(CORRECTION_TEXT_LIMITS.explanation),
});

export const correctionSchema = correctionFormSchema
  .superRefine((v, ctx) => {
    const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
    if (v.kind === null) report(['kind'], 'Choisissez le type de correction');
    else if (v.kind === 'explain' && !v.explanation) report(['explanation'], 'Expliquez la correction à apporter');
  })
  .transform((v): CorrectionDetails => {
    const kind = defined(v.kind);
    return kind === 'explain' ? { kind, explanation: v.explanation } : { kind };
  });

export type CorrectionFormValues = z.input<typeof correctionSchema>;

export const createEmptyCorrectionForm = (): CorrectionFormValues => ({ kind: null, explanation: '' });

export const toCorrectionFormValues = (d: CorrectionDetails): CorrectionFormValues => ({
  kind: d.kind,
  explanation: d.kind === 'explain' ? d.explanation : '',
});