import 'server-only';
import type { Prisma, RequestType, ServiceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatCents } from '@/lib/pricing/money';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { CONTACT } from '@/shared/constants/contact';
import { formatServiceDelay } from '@/lib/orders/serviceDelay';
import { LARGE_FORMAT_SERVICES } from '@/features/services/constants/largeFormat';
import { parseLargeFormatService } from '@/features/services/schemas/largeFormatDomain.schema';
import { describeLargeFormatService } from '@/features/services/utils/largeFormatText';

/* ── Données de la commande ───────────────────────────────────── */

const receiptSelect = {
  orderNumber: true,
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
  products: { select: { productName: true, quantity: true, unitPrice: true } },
  serviceRequests: {
    select: {
      requestType: true,
      delay: true,
      requestedDate: true,
      addresses: {
        select: {
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

type Receipt = Prisma.OrderGetPayload<{ select: typeof receiptSelect }>;
type ReceiptAddress = Receipt['serviceRequests'][number]['addresses'][number];

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

/* ── Mise en forme du texte ───────────────────────────────────── */

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
    : ['Ramassage : 2160 rue Léger'];
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
    `Total : ${fmt(order.total)}`,
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
        `- [${REQUEST_LABELS[request.requestType]}] ${formatAddress(address)} : ` +
          address.services.map((s) => SERVICE_LABELS[s.type]).join(', '),
        ...address.services.flatMap(largeFormatDetailLines),
      ]),
    ]),
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

  // Courriel interne : détail complet pour traiter la commande
  try {
    await sendEmail({
      to: INTERNAL_EMAIL,
      replyTo: order.email, // répondre écrit directement au client
      subject: `[Commande ${order.orderNumber}] ${order.firstName} ${order.lastName}`,
      text: joinSections(
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
      ),
    });
  } catch (err) {
    console.error('[receipts] Échec du courriel interne :', order.orderNumber, err);
  }

  // Confirmation au client : envoyée même si le courriel interne a échoué
  try {
    await sendEmail({
      to: order.email,
      replyTo: INTERNAL_EMAIL, // si le client répond, ça arrive à l'interne
      subject: `Confirmation de votre commande n° ${order.orderNumber} | Pancarte Express`,
      text: joinSections(
        [
          `Bonjour ${order.firstName},`,
          '',
          `Merci pour votre commande n° ${order.orderNumber}. En voici le récapitulatif.`,
        ],
        deliveryLines(order),
        productLines(order),
        serviceLines(order),
        ['Pancarte Express', `${CONTACT.mainPhone} · ${CONTACT.infoEmail}`],
      ),
    });
  } catch (err) {
    console.error('[receipts] Échec de la confirmation client :', order.orderNumber, err);
  }
}