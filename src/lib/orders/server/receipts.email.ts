import 'server-only';
import type { OrderStatus, Prisma, ServiceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatCents } from '@/lib/pricing/money';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import { buildClientReceipt } from './clientReceipt';
import { sendServiceAddressEmails } from './serviceAddress.email';
import { formatAddressNumber } from '@/lib/services/addressNumber';
import { servicesTranslator } from '@/lib/i18n/looseTranslator';
import { attachmentLink } from '@/lib/attachments/server/signedLink';

/* ── Données de la commande ───────────────────────────────────── */

const receiptSelect = {
  orderNumber: true,
  // Client connecté (membre) ou invité
  userId: true,
  locale: true,
  internalReceiptSentAt: true,
  clientReceiptSentAt: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  billedToEmail: true,
  companyName: true,
  billingAddress: true,
  additionalInfo: true,
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
      addresses: {
        select: {
          addressNumber: true,
          delay: true,
          requestedDate: true,
          kind: true,
          streetNumber: true,
          streetName: true,
          apartment: true,
          description: true,
          nearbyAddress: true,
          city: true,
          services: { select: { type: true, details: true } },
          attachments: { orderBy: { createdAt: 'asc' }, select: { id: true, fileName: true } },
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
  delivery: 'Livraison de matériel',
};

/* ── Mise en forme du reçu interne (français) ────────────────── */

const fmt = (cents: number) => formatCents(cents, 'fr');

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

/** Un numéro PE par adresse et ses types : le détail complet part dans le courriel de chaque numéro */
function serviceLines(order: Receipt): string[] {
  if (order.serviceRequests.length === 0) return [];
  return [
    'Services (prix sur soumission) :',
    ...order.serviceRequests.flatMap((request) =>
      request.addresses.map(
        (address) =>
          `- ${formatAddressNumber(address.addressNumber)} — ${address.services.map((s) => SERVICE_LABELS[s.type]).join(', ')}`,
      ),
    ),
  ];
}

/** Pièces jointes de toute la commande, regroupées par numéro PE (liens signés, 30 jours) */
function attachmentLines(order: Receipt): string[] {
  const addresses = order.serviceRequests
    .flatMap((request) => request.addresses)
    .filter((address) => (address.attachments?.length ?? 0) > 0);
  if (addresses.length === 0) return [];
  return [
    'Pièces jointes :',
    ...addresses.flatMap((address) => [
      `${formatAddressNumber(address.addressNumber)} :`,
      ...address.attachments.map((f) => `- ${f.fileName} : ${attachmentLink(f.id)}`),
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

  // Courriel interne : toujours en français, pour l'équipe
  const t = servicesTranslator('fr');
  const internalSections = [
    [
      // Le numéro est déjà dans le titre : on indique plutôt le type de client
      order.userId ? t('emails.memberClient') : t('emails.guestClient'),
      paymentLine,
      '',
      `Client : ${order.firstName} ${order.lastName}`,
      `Courriel : ${order.email}`,
      `Téléphone : ${order.phone ?? '—'}`,
      // Facturation figée à la commande (invité : formulaire ; membre : compte du payeur)
      ...(order.billedToEmail && order.billedToEmail !== order.email ? [`Facturé à : ${order.billedToEmail}`] : []),
      ...(order.companyName ? [`Entreprise : ${order.companyName}`] : []),
      ...(order.billingAddress ? [`Adresse de facturation : ${order.billingAddress}`] : []),
      ...(order.additionalInfo ? [`Informations supplémentaires : ${order.additionalInfo}`] : []),
    ],
    deliveryLines(order),
    productLines(order),
    serviceLines(order),
    attachmentLines(order),
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

  // Un courriel interne détaillé par numéro PE (ne lève jamais)
  await sendServiceAddressEmails(orderId);

  // Confirmation au client, connecté ou invité : envoyée même si le courriel interne a échoué (la commande est enregistrée)
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
      OR: [
        { internalReceiptSentAt: null },
        { clientReceiptSentAt: null },
        { serviceRequests: { some: { addresses: { some: { internalEmailSentAt: null } } } } },
      ],
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
