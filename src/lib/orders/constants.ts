import type { RequestType, ServiceDelay } from '@prisma/client';

export const MAX_QUANTITY = 99;
export const REQUEST_TYPES = ['residential', 'commercial'] as const satisfies readonly RequestType[];
export const SERVICE_DELAYS = ['standard24h', 'urgent12h', 'sameDay', 'specificDate'] as const satisfies readonly ServiceDelay[];