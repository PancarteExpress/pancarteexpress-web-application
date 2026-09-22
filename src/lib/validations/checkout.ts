import { z } from 'zod';
import { MAX_QUANTITY } from '@/lib/constants/cart';
import { REQUEST_TYPES } from '@/lib/constants/services';
import { SERVICE_TYPES } from '@/lib/pricing/constants';

// Limites anti-abus : un payload légitime n'en approche jamais
const MAX_CART_ITEMS = 50;
const MAX_ADDRESSES_PER_REQUEST = 20;
const MAX_SERVICES_PER_ADDRESS = 10;
const MAX_DETAILS_BYTES = 20_000;

// Les messages sont des clés de traduction (namespace checkout.errors)
const requiredText = (max: number) =>
  z.string().trim().min(1, { message: 'required' }).max(max, { message: 'tooLong' });

const optionalText = (max: number) =>
  z.string().trim().max(max, { message: 'tooLong' }).optional();

const postalCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/, { message: 'invalidPostalCode' })
  .transform((v) => `${v.replace(' ', '').slice(0, 3)} ${v.replace(' ', '').slice(3)}`);

/* ── Formulaire (coordonnées + livraison) ─────────────────────── */

export const contactSchema = z.object({
  firstName: requiredText(100),
  lastName: requiredText(100),
  email: z.string().trim().toLowerCase().max(254).email({ message: 'invalidEmail' }),
});

export const shippingAddressSchema = z.object({
  street: requiredText(200),
  city: requiredText(100),
  postalCode: postalCodeSchema,
  province: z.string().trim().toUpperCase().length(2, { message: 'invalidProvince' }),
});

export const fulfillmentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('PICKUP') }),
  z.object({ method: z.literal('DELIVERY'), shippingAddress: shippingAddressSchema }),
]);

export const checkoutFormSchema = z.object({
  contact: contactSchema,
  fulfillment: fulfillmentSchema.nullable(),
});

/* ── Items du panier ──────────────────────────────────────────── */

const productItemSchema = z.object({
  kind: z.literal('product'),
  productId: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
});

// Forme libre pour l'instant, bornée en taille ; à resserrer avec les vrais types d'installation
const serviceDetailsSchema = z
  .record(z.string(), z.unknown())
  .refine((d) => JSON.stringify(d).length <= MAX_DETAILS_BYTES, { message: 'detailsTooLarge' });

const serviceSchema = z.object({
  type: z.enum(SERVICE_TYPES),
  details: serviceDetailsSchema,
});

const servicesSchema = z.array(serviceSchema).min(1, { message: 'noService' }).max(MAX_SERVICES_PER_ADDRESS);

const streetAddressSchema = z.object({
  type: z.literal('address'),
  streetNumber: requiredText(20),
  streetName: requiredText(200),
  apartment: optionalText(20),
  city: requiredText(100),
  postalCode: postalCodeSchema,
  services: servicesSchema,
});

const terrainAddressSchema = z.object({
  type: z.literal('terrain'),
  description: requiredText(1000),
  city: requiredText(100),
  nearbyAddress: optionalText(300),
  services: servicesSchema,
});

const serviceAddressSchema = z.discriminatedUnion('type', [streetAddressSchema, terrainAddressSchema]);

const serviceRequestItemSchema = z.object({
  kind: z.literal('serviceRequest'),
  requestType: z.enum(REQUEST_TYPES),
  addresses: z.array(serviceAddressSchema).min(1).max(MAX_ADDRESSES_PER_REQUEST),
});

const checkoutItemSchema = z.discriminatedUnion('kind', [productItemSchema, serviceRequestItemSchema]);

/* ── Payload complet (POST /api/checkout) ─────────────────────── */

export const checkoutPayloadSchema = checkoutFormSchema
  .extend({
    idempotencyKey: z.string().uuid(),
    items: z.array(checkoutItemSchema).min(1, { message: 'emptyCart' }).max(MAX_CART_ITEMS),
  })
  .superRefine((data, ctx) => {
    const productIds = data.items.flatMap((i) => (i.kind === 'product' ? [i.productId] : []));

    if (productIds.length > 0 && !data.fulfillment) {
      ctx.addIssue({ code: 'custom', path: ['fulfillment'], message: 'fulfillmentRequired' });
    }
    if (productIds.length === 0 && data.fulfillment) {
      ctx.addIssue({ code: 'custom', path: ['fulfillment'], message: 'fulfillmentNotAllowed' });
    }
    if (new Set(productIds).size !== productIds.length) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: 'duplicateProduct' });
    }
  });

/* ── Réponse (validée côté client) ────────────────────────────── */

export const checkoutResponseSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('payment'), orderNumber: z.number().int(), clientSecret: z.string().min(1), total: z.number().int() }),
  z.object({ mode: z.literal('submitted'), orderNumber: z.number().int(), total: z.number().int() }),
]);

/* ── Types ────────────────────────────────────────────────────── */

export type CheckoutForm = z.infer<typeof checkoutFormSchema>;
export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
export type CheckoutItemPayload = z.infer<typeof checkoutItemSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;