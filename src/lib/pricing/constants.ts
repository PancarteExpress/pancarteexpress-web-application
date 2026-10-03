export const SERVICE_TYPES = ['installation', 'removal', 'correction'] as const;
export type PricedServiceType = (typeof SERVICE_TYPES)[number];

export const TAX_RATES = {
  tps: 0.05,
  tvq: 0.09975,
} as const;