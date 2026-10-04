import 'server-only';
import { getTranslations } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog/catalog';
import { Prisma, type OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/server';
import { calculateTotals } from '@/lib/pricing/calculateTotals';
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
  const totals = calculateTotals(orderLines);

  const shipping = payload.fulfillment?.method === 'DELIVERY' ? payload.fulfillment.shippingAddress : null;

  const requiresPayment = !user && totals.total > 0;
  const status: OrderStatus = requiresPayment ? 'AWAITING_PAYMENT' : 'PENDING';

  let order: { id: string; orderNumber: number; total: number };
  try {
    // Écriture imbriquée : Prisma l'exécute dans une seule transaction
    order = await prisma.order.create({
      data: {
        idempotencyKey: payload.idempotencyKey,
        status,
        // MODIFIÉ : les produits commencent en préparation ; null s'il n'y en a pas
        productsStatus: orderLines.length > 0 ? 'PREPARING' : null,
        userId: user?.id ?? null,
        firstName: payload.contact.firstName,
        lastName: payload.contact.lastName,
        // Connecté : le courriel du compte fait foi, pas celui du formulaire
        email: user?.email ?? payload.contact.email,
        phone: null, // MODIFIÉ : ajouté à l'étape 3
        // MODIFIÉ : fulfillmentMethod / shipping* → delivery*
        deliveryMode: payload.fulfillment?.method ?? null,
        deliveryStreet: shipping?.street ?? null,
        deliveryCity: shipping?.city ?? null,
        deliveryPostalCode: shipping?.postalCode ?? null,
        deliveryProvince: shipping?.province ?? null,
        // MODIFIÉ : montants simplifiés (produits seulement)
        subtotal: totals.subtotal,
        tps: totals.tps,
        tvq: totals.tvq,
        total: totals.total,
        paidAt: null,
        products: { create: orderLines }, // MODIFIÉ : items → products
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

  if (!requiresPayment) {
    return { mode: 'submitted', orderNumber: order.orderNumber, total: order.total };
  }

  return attachPaymentIntent(order, payload.contact.email);
}

/* ── Produits ─────────────────────────────────────────────────── */

async function buildProductLines(items: ProductItem[]) {
  if (items.length === 0) return [];

  // Absent du catalogue ou désactivé (isActive: false)
  const missing = items.filter((i) => !getProductBySlug(i.productId)).map((i) => i.productId);
  if (missing.length > 0) throw new ProductUnavailableError(missing);

  // Nom figé en français, quelle que soit la langue du client : plus simple pour le SuperAdmin
  const t = await getTranslations({ locale: 'fr', namespace: 'products' });

  return items.flatMap((item) => {
    const product = getProductBySlug(item.productId);
    return product
      ? [
          {
            productSlug: product.slug, // MODIFIÉ : productId → productSlug
            productName: t(`${product.slug}.name`),
            unitPrice: product.price,
            quantity: item.quantity,
          },
        ]
      : [];
  });
}

/* ── Services ─────────────────────────────────────────────────── */

const toServiceRequestCreate = (item: ServiceRequestItem): Prisma.ServiceRequestCreateWithoutOrderInput => ({
  requestType: item.requestType,
  addresses: {
    create: item.addresses.map((address) => ({
      // MODIFIÉ : le client utilise encore 'address' ; la BD utilise 'civicAddress'
      kind: address.type === 'address' ? 'civicAddress' : 'terrain',
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
          // MODIFIÉ : unitPrice retiré ; status vaut TO_SCHEDULE par défaut (schéma)
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
      // Une clé par commande : une commande recréée obtient un nouveau paiement, sans conflit
      { idempotencyKey: `order-${order.id}` },
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