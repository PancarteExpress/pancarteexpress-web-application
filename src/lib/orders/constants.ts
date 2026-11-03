import type { RequestType } from '@prisma/client';

export const MAX_QUANTITY = 99;
export const REQUEST_TYPES = ['residential', 'commercial'] as const satisfies readonly RequestType[];
