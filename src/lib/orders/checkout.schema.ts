import * as z from 'zod';
import { format } from 'date-fns';
import { MAX_QUANTITY, REQUEST_TYPES, SERVICE_DELAYS } from '@/lib/orders/constants';
import { SERVICE_TYPES } from '@/lib/pricing/constants';
import { earliestSpecificDate, isBusinessDay, parseIso, todayInMontreal } from '@/features/services/utils/holidays';
import { isValidIsoDate } from '@/features/services/utils/time';
import { LARGE_FORMAT_SERVICES } from '@/features/services/constants/largeFormat';
import { parseServiceDetails } from '@/features/services/schemas/serviceDetails.schema';

const LARGE_FORMAT_SET: ReadonlySet<string> = new Set(LARGE_FORMAT_SERVICES);
const isLargeFormatService = (type: string) => LARGE_FORMAT_SET.has(type);

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

const scheduleSchema = z
  .object({
    delay: z.enum(SERVICE_DELAYS),
    date: z.string().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.delay !== 'specificDate') return;
    // Revalidé côté serveur : le client peut être modifié
    const earliest = format(earliestSpecificDate(todayInMontreal()), 'yyyy-MM-dd');
    const valid = s.date !== undefined && isValidIsoDate(s.date) && s.date >= earliest && isBusinessDay(parseIso(s.date));
    if (!valid) ctx.addIssue({ code: 'custom', path: ['date'], message: 'invalidServiceDate' });
  });

/* ── Formulaire (coordonnées + livraison) ─────────────────────── */

export const checkoutContactSchema = z.object({
  firstName: requiredText(100),
  lastName: requiredText(100),
  email: z.string().trim().toLowerCase().max(254).email({ message: 'invalidEmail' }),
  phone: z.string().trim().regex(/^[\d\s()+.-]{10,20}$/, { message: 'invalidPhone' }).optional(),
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
  contact: checkoutContactSchema,
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

const serviceSchema = z
  .object({
    type: z.enum(SERVICE_TYPES),
    details: serviceDetailsSchema,
  })
  .superRefine((s, ctx) => {
    if (!parseServiceDetails(s.type, s.details)) {
      ctx.addIssue({ code: 'custom', path: ['details'], message: 'invalidServiceDetails' });
    }
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

const serviceRequestItemSchema = z
  .object({
    kind: z.literal('serviceRequest'),
    requestType: z.enum(REQUEST_TYPES),
    /** Résidentiel : obligatoire ; grand format : null (pas de délai) */
    schedule: scheduleSchema.nullable(),
    addresses: z.array(serviceAddressSchema).min(1).max(MAX_ADDRESSES_PER_REQUEST),
  })
  .superRefine((item, ctx) => {
    const residential = item.requestType === 'residential';
    if (residential !== (item.schedule !== null)) {
      ctx.addIssue({ code: 'custom', path: ['schedule'], message: 'invalidSchedule' });
    }
    // Chaque service doit appartenir au type de la demande (pas de service résidentiel dans une demande grand format)
    const mismatch = item.addresses.some((a) => a.services.some((s) => isLargeFormatService(s.type) === residential));
    if (mismatch) ctx.addIssue({ code: 'custom', path: ['addresses'], message: 'invalidSchedule' });
  });

const checkoutItemSchema = z.discriminatedUnion('kind', [productItemSchema, serviceRequestItemSchema]);

/* ── Payload complet (POST /api/checkout) ─────────────────────── */

export const checkoutPayloadSchema = checkoutFormSchema
  .extend({
    idempotencyKey: z.string().uuid(),
    items: z.array(checkoutItemSchema).min(1, { message: 'emptyCart' }).max(MAX_CART_ITEMS),
    locale: z.enum(['fr', 'en']).default('fr'),
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