import 'server-only';
import nodemailer from 'nodemailer';
import type { Prisma, RequestType, ServiceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatCents } from '@/lib/pricing/money';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
      addresses: {
        select: {
          kind: true,
          streetNumber: true,
          streetName: true,
          apartment: true,
          description: true,
          nearbyAddress: true,
          city: true,
          services: { select: { type: true } },
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

function serviceLines(order: Receipt): string[] {
  if (order.serviceRequests.length === 0) return [];
  return [
    'Services (prix sur soumission) :',
    ...order.serviceRequests.flatMap((request) =>
      request.addresses.map(
        (address) =>
          `- [${REQUEST_LABELS[request.requestType]}] ${formatAddress(address)} : ` +
          address.services.map((s) => SERVICE_LABELS[s.type]).join(', '),
      ),
    ),
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
    console.info('[receipts] Envoi pour la commande', orderId); // TEMPORAIRE
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
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_TO,
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
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: order.email,
      replyTo: process.env.CONTACT_TO, // si le client répond, ça arrive à l'interne
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
        ['Pancarte Express', '514-825-2709 · info@pancarteexpress.com'],
      ),
    });
  } catch (err) {
    console.error('[receipts] Échec de la confirmation client :', order.orderNumber, err);
  }
}