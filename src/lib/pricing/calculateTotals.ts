import { calculateTaxes } from './taxes';

export interface ProductLine {
  unitPrice: number; // cents
  quantity: number;
}

export interface Totals {
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
}

/** Seuls les produits ont un prix ; les services sont facturés séparément, sur soumission */
export function calculateTotals(productLines: readonly ProductLine[]): Totals {
  const subtotal = productLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const { tps, tvq } = calculateTaxes(subtotal);
  return { subtotal, tps, tvq, total: subtotal + tps + tvq };
}