import 'server-only';
import { Prisma, type OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { calculateTotals } from '@/lib/pricing/calculateTotals';
import { calculateServicePrice } from '@/lib/pricing/servicePricing';
import type { CheckoutItemPayload, CheckoutPayload, CheckoutResponse } from '@/lib/validations/checkout';
import { CheckoutConflictError, PaymentProviderError, ProductUnavailableError } from './errors';

export interface CheckoutUser {
  id: string;
  email: string;
}

type ProductItem = Extract<CheckoutItemPayload, { kind: 'product' }>;
type ServiceRequestItem = Extract<CheckoutItemPayload, { kind: 'serviceRequest' }>;

const existingOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  userId: true,
  paymentIntentId: true,
} satisfies Prisma.OrderSelect;

type ExistingOrder = Prisma.OrderGetPayload<{ select: typeof existingOrderSelect }>;

/* ── Point d'entrée ───────────────────────────────────────────── */

export async function createOrder(payload: CheckoutPayload, user: CheckoutUser | null): Promise<CheckoutResponse> {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: payload.idempotencyKey },
    select: existingOrderSelect,
  });
  if (existing) return replay(existing);

  const productItems = payload.items.filter((i): i is ProductItem => i.kind === 'product');
  const serviceItems = payload.items.filter((i): i is ServiceRequestItem => i.kind === 'serviceRequest');

  const orderLines = await buildProductLines(productItems);
  const totals = calculateTotals({
    productLines: orderLines,
    serviceRequests: serviceItems,
    fulfillmentMethod: payload.fulfillment?.method ?? null,
  });

  const shipping = payload.fulfillment?.method === 'DELIVERY' ? payload.fulfillment.shippingAddress : null;
  const status: OrderStatus = user ? 'PENDING' : 'AWAITING_PAYMENT';

  let order: { id: string; orderNumber: number; total: number };
  try {
    // Écriture imbriquée : Prisma l'exécute dans une seule transaction
    order = await prisma.order.create({
      data: {
        idempotencyKey: payload.idempotencyKey,
        status,
        userId: user?.id ?? null,
        firstName: payload.contact.firstName,
        lastName: payload.contact.lastName,
        // Connecté : le courriel du compte fait foi, pas celui du formulaire
        email: user?.email ?? payload.contact.email,
        fulfillmentMethod: payload.fulfillment?.method ?? null,
        shippingStreet: shipping?.street ?? null,
        shippingCity: shipping?.city ?? null,
        shippingPostalCode: shipping?.postalCode ?? null,
        shippingProvince: shipping?.province ?? null,
        productsSubtotal: totals.productsSubtotal,
        servicesSubtotal: totals.servicesSubtotal,
        shippingFee: totals.shippingFee,
        subtotal: totals.subtotal,
        tps: totals.tps,
        tvq: totals.tvq,
        total: totals.total,
        paidAt: null,
        items: { create: orderLines },
        serviceRequests: { create: serviceItems.map(toServiceRequestCreate) },
      },
      select: { id: true, orderNumber: true, total: true },
    });
  } catch (error) {
    // Deux requêtes simultanées avec la même clé : la seconde rejoue la première
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const winner = await prisma.order.findUnique({
        where: { idempotencyKey: payload.idempotencyKey },
        select: existingOrderSelect,
      });
      if (winner) return replay(winner);
    }
    throw error;
  }

  if (user) {
    return { mode: 'submitted', orderNumber: order.orderNumber, total: order.total };
  }

  return attachPaymentIntent(order, payload.contact.email, payload.idempotencyKey);
}

/* ── Produits ─────────────────────────────────────────────────── */

async function buildProductLines(items: ProductItem[]) {
  if (items.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    select: { id: true, nameFr: true, price: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const missing = items.filter((i) => !byId.has(i.productId)).map((i) => i.productId);
  if (missing.length > 0) throw new ProductUnavailableError(missing);

  return items.flatMap((item) => {
    const product = byId.get(item.productId);
    return product
      ? [{ productId: product.id, productName: product.nameFr, unitPrice: product.price, quantity: item.quantity }]
      : [];
  });
}

/* ── Services ─────────────────────────────────────────────────── */

const toServiceRequestCreate = (item: ServiceRequestItem): Prisma.ServiceRequestCreateWithoutOrderInput => ({
  requestType: item.requestType,
  addresses: {
    create: item.addresses.map((address) => ({
      kind: address.type,
      city: address.city,
      ...(address.type === 'address'
        ? {
            streetNumber: address.streetNumber,
            streetName: address.streetName,
            apartment: address.apartment ?? null,
            postalCode: address.postalCode,
          }
        : {
            description: address.description,
            nearbyAddress: address.nearbyAddress ?? null,
          }),
      services: {
        create: address.services.map((service) => ({
          type: service.type,
          unitPrice: calculateServicePrice(service),
          // Issu d'un JSON parsé et validé par Zod : forcément sérialisable
          details: service.details as Prisma.InputJsonValue,
        })),
      },
    })),
  },
});

/* ── Stripe (invité) ──────────────────────────────────────────── */

async function attachPaymentIntent(
  order: { id: string; orderNumber: number; total: number },
  email: string,
  idempotencyKey: string,
): Promise<CheckoutResponse> {
  let intentId: string | null = null;

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: order.total,
        currency: 'cad',
        payment_method_types: ['card'],
        receipt_email: email,
        metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
      },
      // Même clé que la commande : un retry ne crée pas un second PaymentIntent
      { idempotencyKey: `checkout-${idempotencyKey}` },
    );
    intentId = intent.id;

    if (!intent.client_secret) throw new Error('client_secret absent');

    await prisma.order.update({ where: { id: order.id }, data: { paymentIntentId: intent.id } });

    return { mode: 'payment', orderNumber: order.orderNumber, clientSecret: intent.client_secret, total: order.total };
  } catch (error) {
    // Aucun orphelin : ni commande sans paiement possible, ni PaymentIntent sans commande
    if (intentId) await stripe.paymentIntents.cancel(intentId).catch(() => undefined);
    await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
    throw new PaymentProviderError('Création du paiement impossible', { cause: error });
  }
}

/* ── Rejeu idempotent ─────────────────────────────────────────── */

async function replay(order: ExistingOrder): Promise<CheckoutResponse> {
  if (order.status === 'PENDING') {
    return { mode: 'submitted', orderNumber: order.orderNumber, total: order.total };
  }
  if (order.status !== 'AWAITING_PAYMENT') {
    throw new CheckoutConflictError('alreadyProcessed', order.orderNumber);
  }
  if (!order.paymentIntentId) {
    // La première requête est encore en train de créer le PaymentIntent
    throw new CheckoutConflictError('inProgress', order.orderNumber);
  }

  const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
  if (!intent.client_secret || intent.status === 'succeeded' || intent.status === 'canceled') {
    throw new CheckoutConflictError('alreadyProcessed', order.orderNumber);
  }

  return { mode: 'payment', orderNumber: order.orderNumber, clientSecret: intent.client_secret, total: order.total };
}