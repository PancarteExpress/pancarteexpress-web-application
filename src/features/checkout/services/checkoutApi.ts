import type { z } from 'zod';
import type { CartItem } from '@/features/cart/types/cart';
import {
  checkoutResponseSchema,
  type checkoutPayloadSchema,
  type CheckoutResponse,
} from '@/lib/validations/checkout';
import type { CheckoutInput } from '../types';

/** Ce que le client envoie (avant les transformations Zod du serveur) */
type CheckoutPayload = z.input<typeof checkoutPayloadSchema>;

/* ── 1. Construire le payload ─────────────────────────────────── */

export function buildCheckoutPayload(
  form: CheckoutInput,
  items: readonly CartItem[],
  idempotencyKey: string,
): CheckoutPayload {
  const hasProducts = items.some((i) => i.kind === 'product');

  return {
    idempotencyKey,
    contact: { firstName: form.firstName, lastName: form.lastName, email: form.email },
    // L'API refuse un mode de réception quand il n'y a que des services
    fulfillment: !hasProducts
      ? null
      : form.deliveryMode === 'delivery' && form.shippingAddress
        ? { method: 'DELIVERY', shippingAddress: form.shippingAddress }
        : { method: 'PICKUP' },
    items: items.map((item) =>
      item.kind === 'product'
        ? { kind: 'product', productId: item.productId, quantity: item.quantity }
        : {
            kind: 'serviceRequest',
            requestType: item.requestType,
            addresses: item.addresses.map((address) => ({
              ...address,
              // Le serveur attend { type, details } ; les `id` sont ignorés par sa validation
              services: address.services.map(({ type, ...details }) => ({ type, details })),
            })),
          },
    ),
  };
}

/* ── 2. Envoyer ───────────────────────────────────────────────── */

export type CheckoutErrorCode =
  | 'validationFailed'
  | 'productUnavailable'
  | 'alreadyProcessed'
  | 'inProgress'
  | 'network'
  | 'serverError';

const KNOWN_CODES: ReadonlySet<string> = new Set(['validationFailed', 'productUnavailable', 'alreadyProcessed', 'inProgress']);

export class CheckoutApiError extends Error {
  constructor(public readonly code: CheckoutErrorCode) {
    super(code);
    this.name = 'CheckoutApiError';
  }
}

export async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  let res: Response;
  try {
    res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CheckoutApiError('network'); // pas de connexion, serveur injoignable
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const code = (body as { error?: unknown } | null)?.error;
    throw new CheckoutApiError(typeof code === 'string' && KNOWN_CODES.has(code) ? (code as CheckoutErrorCode) : 'serverError');
  }

  // On vérifie que la réponse a bien la forme attendue avant de l'utiliser
  const parsed = checkoutResponseSchema.safeParse(body);
  if (!parsed.success) throw new CheckoutApiError('serverError');

  return parsed.data;
}