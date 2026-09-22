import { TAX_RATES } from './constants';

export interface Taxes {
  tps: number;
  tvq: number;
}

/** Au Québec, TPS et TVQ sont calculées séparément sur le même montant (pas de taxe sur taxe). */
export const calculateTaxes = (taxableAmount: number): Taxes => ({
  tps: Math.round(taxableAmount * TAX_RATES.tps),
  tvq: Math.round(taxableAmount * TAX_RATES.tvq),
});