import { describe, expect, it } from 'vitest';
import { calculateTotals } from './calculateTotals';

describe('calculateTotals', () => {
  it('calcule le sous-total et les taxes des produits', () => {
    const totals = calculateTotals([
      { unitPrice: 2500, quantity: 2 },
      { unitPrice: 99, quantity: 3 },
    ]);

    expect(totals.subtotal).toBe(5297);
    expect(totals.tps).toBe(265);
    expect(totals.tvq).toBe(528);
    expect(totals.total).toBe(6090);
  });

  it('vaut 0 sans produit (services seulement)', () => {
    expect(calculateTotals([])).toEqual({ subtotal: 0, tps: 0, tvq: 0, total: 0 });
  });
});