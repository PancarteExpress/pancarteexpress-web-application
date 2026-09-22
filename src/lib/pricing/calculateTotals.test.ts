import { describe, expect, it } from 'vitest';
import { calculateTotals } from './calculateTotals';

describe('calculateTotals', () => {
  it('calcule services multi-adresses + produit livré', () => {
    const totals = calculateTotals({
      productLines: [{ unitPrice: 2500, quantity: 2 }],
      serviceRequests: [{
        addresses: [
          { services: [{ type: 'installation' }, { type: 'removal' }] },
          { services: [{ type: 'correction' }] },
        ],
      }],
      fulfillmentMethod: 'DELIVERY',
    });

    expect(totals.servicesSubtotal).toBe(29997);
    expect(totals.shippingFee).toBe(5000);
    expect(totals.subtotal).toBe(39997);
    expect(totals.tps).toBe(2000);
    expect(totals.tvq).toBe(3990);
    expect(totals.total).toBe(45987);
  });

  it("n'applique pas de livraison sans produit", () => {
    const totals = calculateTotals({
      productLines: [],
      serviceRequests: [{ addresses: [{ services: [{ type: 'installation' }] }] }],
      fulfillmentMethod: 'DELIVERY',
    });
    expect(totals.shippingFee).toBe(0);
  });
});