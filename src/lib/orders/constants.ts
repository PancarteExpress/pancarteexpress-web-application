import type { OrderStatus, Prisma, RequestType, ServiceDelay } from '@prisma/client';

export const MAX_QUANTITY = 99;
export const REQUEST_TYPES = ['residential', 'commercial'] as const satisfies readonly RequestType[];
export const SERVICE_DELAYS = ['standard24h', 'urgent12h', 'sameDay', 'specificDate'] as const satisfies readonly ServiceDelay[];

/** Commandes confirmées : payées, ou sans paiement requis (services seuls). Exclut AWAITING_PAYMENT */
export const CONFIRMED_ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

/** Filtre Prisma prêt à l'emploi : commandes confirmées seulement */
export const CONFIRMED_ORDER_WHERE = {
  status: { in: [...CONFIRMED_ORDER_STATUSES] },
} satisfies Prisma.OrderWhereInput;