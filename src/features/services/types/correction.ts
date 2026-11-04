export type CorrectionDetails =
  | { kind: 'straighten' }
  | { kind: 'explain'; explanation: string };