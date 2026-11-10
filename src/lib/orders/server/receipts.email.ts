import 'server-only';
import type { OrderStatus, Prisma, RequestType, ServiceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatCents } from '@/lib/pricing/money';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import { formatServiceDelay } from '@/lib/orders/serviceDelay';
import { LARGE_FORMAT_SERVICES } from '@/features/services/constants/largeFormat';
import { parseLargeFormatService } from '@/features/services/schemas/largeFormatDomain.schema';
import { describeLargeFormatService } from '@/features/services/utils/largeFormatText';
import { buildClientReceipt } from './clientReceipt';
import { formatAddressNumber } from '@/lib/services/addressNumber';

/* ── Données de la commande ───────────────────────────────────── */

const receiptSelect = {
  orderNumber: true,
  locale: true,
  userId: true,
  internalReceiptSentAt: true,
  clientReceiptSentAt: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  paidAt: true,
  deliveryMode: true,
  deliveryStreet: true,
  deliveryCity: true,
  deliveryPostalCode: true,
  subtotal: true,
  tps: true,
  tvq: true,
  total: true,
  products: { select: { productSlug: true, productName: true, quantity: true, unitPrice: true } },
  serviceRequests: {
    select: {
      requestType: true,
      delay: true,
      requestedDate: true,
      addresses: {
        select: {
          addressNumber: true,
          kind: true,
          streetNumber: true,
          streetName: true,
          apartment: true,
          description: true,
          nearbyAddress: true,
          city: true,
          services: { select: { type: true, details: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export type Receipt = Prisma.OrderGetPayload<{ select: typeof receiptSelect }>;
export type ReceiptAddress = Receipt['serviceRequests'][number]['addresses'][number];

const SERVICE_LABELS: Record<ServiceType, string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
  pickup: 'Ramassage',
  largeInstallation: 'Installation grand format',
  largeStoragePickup: 'Ramassage pour entreposage (grand format)',
  largeRetrieval: 'Récupération grand format',
};

const REQUEST_LABELS: Record<RequestType, string> = {
  residential: 'Résidentielle',
  commercial: 'Grand format',
};

/* ── Mise en forme du reçu interne (français) ────────────────── */

const fmt = (cents: number) => formatCents(cents, 'fr');

function formatAddress(address: ReceiptAddress): string {
  if (address.kind === 'civicAddress') {
    const apt = address.apartment ? `, app. ${address.apartment}` : '';
    return `${address.streetNumber ?? ''} ${address.streetName ?? ''}${apt}, ${address.city}`.trim();
  }
  const near = address.nearbyAddress ? ` (près du ${address.nearbyAddress})` : '';
  return `Terrain : ${address.description ?? ''}, ${address.city}${near}`;
}

function deliveryLines(order: Receipt): string[] {
  if (order.products.length === 0) return [];
  return order.deliveryMode === 'DELIVERY'
    ? [`Livraison : ${order.deliveryStreet}, ${order.deliveryCity} ${order.deliveryPostalCode ?? ''}`.trim()]
    : [`Ramassage : ${CONTACT.address}`];
}

function productLines(order: Receipt): string[] {
  if (order.products.length === 0) return [];
  return [
    'Produits :',
    ...order.products.map((p) => `- ${p.productName} ×${p.quantity} : ${fmt(p.unitPrice * p.quantity)}`),
    '',
    `Sous-total : ${fmt(order.subtotal)}`,
    `TPS : ${fmt(order.tps)}`,
    `TVQ : ${fmt(order.tvq)}`,
    // Commande mixte : le total payé ne couvre que les produits
    `Total${order.serviceRequests.length > 0 ? ' (produits seulement)' : ''} : ${fmt(order.total)}`,
  ];
}

const LARGE_FORMAT_SET: ReadonlySet<string> = new Set(LARGE_FORMAT_SERVICES);

/**
 * Détails d'un service grand format. Ces demandes ne passent pas par OptimoRoute :
 * le courriel est la seule trace détaillée pour l'équipe.
 */
function largeFormatDetailLines(service: { type: ServiceType; details: Prisma.JsonValue }): string[] {
  if (!LARGE_FORMAT_SET.has(service.type)) return [];
  const parsed = parseLargeFormatService(service.type, service.details);
  if (!parsed) return [`    ${SERVICE_LABELS[service.type]} : détails illisibles (voir la base de données)`];
  return [`    ${SERVICE_LABELS[service.type]} :`, ...describeLargeFormatService(parsed).map((line) => `      ${line}`)];
}

function serviceLines(order: Receipt): string[] {
  if (order.serviceRequests.length === 0) return [];
  return [
    'Services (prix sur soumission) :',
    ...order.serviceRequests.flatMap((request) => [
      `Délai : ${formatServiceDelay(request.delay, request.requestedDate)}`,
      ...request.addresses.flatMap((address) => [
        `- ${formatAddressNumber(address.addressNumber)} [${REQUEST_LABELS[request.requestType]}] ${formatAddress(address)} : ` +
          address.services.map((s) => SERVICE_LABELS[s.type]).join(', '),
        ...address.services.flatMap(largeFormatDetailLines),
      ]),
    ]),
  ];
}

/** Rappel à l'équipe que les services ne sont jamais payés en ligne : leur prix suit sur soumission */
function servicePricingNote(order: Receipt): string[] {
  if (order.serviceRequests.length === 0) return [];
  return [
    order.products.length > 0
      ? 'À facturer : le montant payé couvre uniquement les produits. Les services sont à facturer sur soumission.'
      : 'À facturer : aucun paiement en ligne. Les services sont à facturer sur soumission.',
  ];
}

/** Assemble des sections, en sautant les sections vides */
const joinSections = (...sections: string[][]): string =>
  sections.filter((s) => s.length > 0).map((s) => s.join('\n')).join('\n\n');

/* ── Envoi ────────────────────────────────────────────────────── */

/**
 * Envoie le reçu interne et la confirmation au client.
 * Ne lève jamais d'erreur : la commande est déjà enregistrée, un échec d'envoi est seulement journalisé.
 */
export async function sendReceipts(orderId: string): Promise<void> {
  let order: Receipt | null;
  try {
    order = await prisma.order.findUnique({ where: { id: orderId }, select: receiptSelect });
  } catch (err) {
    console.error('[receipts] Lecture de la commande impossible :', orderId, err);
    return;
  }
  if (!order) {
    console.error('[receipts] Commande introuvable :', orderId);
    return;
  }

  const paymentLine = order.paidAt ? 'Paiement : reçu' : 'Paiement : non payé en ligne';

  const internalSections = [
    [
      `Commande n° ${order.orderNumber}`,
      paymentLine,
      '',
      `Client : ${order.firstName} ${order.lastName}`,
      `Courriel : ${order.email}`,
      `Téléphone : ${order.phone ?? '—'}`,
    ],
    deliveryLines(order),
    productLines(order),
    serviceLines(order),
    servicePricingNote(order),
  ].filter((section) => section.length > 0);

  // Courriel interne : détail complet pour traiter la commande
  if (!order.internalReceiptSentAt) {
    try {
      await sendEmail({
        to: INTERNAL_EMAIL,
        replyTo: order.email, // répondre écrit directement au client
        subject: `[Commande ${order.orderNumber}] ${order.firstName} ${order.lastName}`,
        text: joinSections(...internalSections),
        html: await renderTextEmail({ title: `Commande n° ${order.orderNumber}`, sections: internalSections, locale: 'fr' }),
      });
      await markSent(orderId, 'internal');
    } catch (err) {
      console.error('[receipts] Échec du courriel interne (relancé par le cron) :', order.orderNumber, err);
    }
  }

  // Client connecté : sa commande est dans son tableau de bord, pas de confirmation par courriel.
  // Marquée comme traitée : le cron ne la relance pas, même si le compte est supprimé ensuite.
  if (order.userId && !order.clientReceiptSentAt) {
    await markSent(orderId, 'client');
    return;
  }

  // Confirmation au client invité : envoyée même si le courriel interne a échoué (la commande est enregistrée)
  if (!order.clientReceiptSentAt) {
    try {
      // Dans la langue du checkout (Order.locale)
      const receipt = buildClientReceipt(order);
      await sendEmail({
        to: order.email,
        replyTo: INTERNAL_EMAIL, // si le client répond, ça arrive à l'interne
        subject: receipt.subject,
        // Le pied de page du gabarit HTML contient déjà les coordonnées
        text: joinSections(...receipt.sections, ['Pancarte Express', `${CONTACT.mainPhone} · ${CONTACT.infoEmail}`]),
        html: await renderTextEmail({ title: receipt.title, sections: receipt.sections, locale: order.locale }),
      });
      await markSent(orderId, 'client');
    } catch (err) {
      console.error('[receipts] Échec de la confirmation client (relancée par le cron) :', order.orderNumber, err);
    }
  }
}

/** Enregistre l'envoi réussi d'un courriel ; un échec ici n'expose qu'à un doublon au prochain cron */
async function markSent(orderId: string, which: 'internal' | 'client'): Promise<void> {
  const now = new Date();
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: which === 'internal' ? { internalReceiptSentAt: now } : { clientReceiptSentAt: now },
    });
  } catch (err) {
    console.error('[receipts] Envoi non enregistré (doublon possible au prochain cron) :', orderId, which, err);
  }
}

const RETRY_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'COMPLETED'];
const RETRY_BATCH = 50;
const HOUR = 60 * 60_000;

/**
 * Relance (cron quotidien) des courriels de commande qui n'ont pas pu partir.
 * Seuls les courriels sans date d'envoi sont renvoyés : aucun doublon.
 */
export async function retryUnsentReceipts(): Promise<number> {
  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: {
      status: { in: RETRY_STATUSES },
      OR: [{ internalReceiptSentAt: null }, { clientReceiptSentAt: null }],
      // Laisse le temps à after() de finir (updatedAt change aussi au paiement)
      updatedAt: { lt: new Date(now - HOUR) },
      // Au-delà d'une semaine, une confirmation n'a plus de sens
      createdAt: { gt: new Date(now - 7 * 24 * HOUR) },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: RETRY_BATCH,
  });

  // Une commande à la fois : ménage le SMTP
  for (const { id } of orders) await sendReceipts(id);
  return orders.length;
}
