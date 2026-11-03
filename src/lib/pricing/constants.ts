import type { ServiceType } from '@prisma/client';

// satisfies : une valeur absente de l'enum Prisma casse la compilation
export const SERVICE_TYPES = ['installation', 'removal', 'correction'] as const satisfies readonly ServiceType[];
export type PricedServiceType = (typeof SERVICE_TYPES)[number];

export const TAX_RATES = {
  tps: 0.05,
  tvq: 0.09975,
} as const;