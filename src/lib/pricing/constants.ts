export const SERVICE_TYPES = ['installation', 'removal', 'correction'] as const;
export type PricedServiceType = (typeof SERVICE_TYPES)[number];

// Prix fictifs en cents, à remplacer par la vraie grille
export const SERVICE_PRICES: Readonly<Record<PricedServiceType, number>> = {
  installation: 9999,
  removal: 9999,
  correction: 9999,
};

export const DELIVERY_FEE = 5000;

export const TAX_RATES = {
  tps: 0.05,
  tvq: 0.09975,
} as const;