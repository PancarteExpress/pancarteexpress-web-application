import { DELIVERY_FEE } from './constants';
import { calculateServiceRequestPrice, type PricedServiceAddress } from './servicePricing';
import { calculateTaxes } from './taxes';

export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';

export interface ProductLine {
  unitPrice: number; // cents
  quantity: number;
}

export interface TotalsInput {
  productLines: readonly ProductLine[];
  serviceRequests: readonly { addresses: readonly PricedServiceAddress[] }[];
  fulfillmentMethod: FulfillmentMethod | null;
}

export interface Totals {
  productsSubtotal: number;
  servicesSubtotal: number;
  shippingFee: number;
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
}

export function calculateTotals({ productLines, serviceRequests, fulfillmentMethod }: TotalsInput): Totals {
  const productsSubtotal = productLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const servicesSubtotal = serviceRequests.reduce(
    (sum, r) => sum + calculateServiceRequestPrice(r.addresses),
    0,
  );

  // Frais de livraison seulement s'il y a des produits à livrer
  const shippingFee = productLines.length > 0 && fulfillmentMethod === 'DELIVERY' ? DELIVERY_FEE : 0;

  const subtotal = productsSubtotal + servicesSubtotal + shippingFee;
  const { tps, tvq } = calculateTaxes(subtotal);

  return { productsSubtotal, servicesSubtotal, shippingFee, subtotal, tps, tvq, total: subtotal + tps + tvq };
}