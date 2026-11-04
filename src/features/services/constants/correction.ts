export const CORRECTION_KINDS = ['straighten', 'explain'] as const;
export type CorrectionKind = (typeof CORRECTION_KINDS)[number];

export const CORRECTION_KIND_LABELS: Record<CorrectionKind, string> = {
  straighten: 'Redressage de matériel',
  explain: 'Expliquer la correction',
};

export const CORRECTION_TEXT_LIMITS = {
  /** Limite large, invisible en usage normal : protège contre un collage accidentel */
  explanation: 2000,
} as const;