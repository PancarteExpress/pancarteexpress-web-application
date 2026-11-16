import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { servicesTranslator } from '@/lib/i18n/looseTranslator';
import { formatServiceDelay } from '@/lib/orders/serviceDelay';
import { SITE_URL } from '@/lib/siteUrl';
import { formatAddressNumber } from '@/lib/services/addressNumber';
import { describeServiceDetailsText } from '@/features/services/utils/serviceDetailsText';

/*
 * Courriel interne par numéro PE (une adresse de service), avec le détail complet de chacun
 * de ses services. Le reçu de la commande, lui, ne liste que les numéros et les types.
 * Toujours en français : destiné à l'équipe.
 */

const addressSelect = {
  id: true,
  addressNumber: true,
  kind: true,
  streetNumber: true,
  streetName: true,
  apartment: true,
  postalCode: true,
  description: true,
  nearbyAddress: true,
  city: true,
  delay: true,
  requestedDate: true,
  services: { orderBy: { id: 'asc' }, select: { type: true, details: true } },
  attachments: { orderBy: { createdAt: 'asc' }, select: { id: true, fileName: true } },
  serviceRequest: {
    select: {
      requestType: true,
      order: { select: { orderNumber: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  },
} satisfies Prisma.ServiceAddressSelect;

type EmailAddress = Prisma.ServiceAddressGetPayload<{ select: typeof addressSelect }>;

function addressLines(a: EmailAddress): string[] {
  if (a.kind === 'civicAddress') {
    const street = [a.streetNumber, a.streetName].filter(Boolean).join(' ');
    const apt = a.apartment ? `, app. ${a.apartment}` : '';
    return [`Adresse : ${street}${apt}, ${a.city}${a.postalCode ? ` ${a.postalCode}` : ''}`];
  }
  return [
    `Terrain : ${a.description ?? '—'}`,
    `Ville : ${a.city}`,
    ...(a.nearbyAddress ? [`Adresse à proximité : ${a.nearbyAddress}`] : []),
  ];
}

/** Rue et ville, pour le sujet */
function shortAddress(a: EmailAddress): string {
  if (a.kind === 'civicAddress') return `${[a.streetNumber, a.streetName].filter(Boolean).join(' ')}, ${a.city}`;
  return `Terrain, ${a.city}`;
}

/** Sujet, titre et sections du courriel d'un numéro PE (exporté pour les tests) */
export function buildServiceAddressEmail(a: EmailAddress) {
  const t = servicesTranslator('fr');
  const { requestType, order } = a.serviceRequest;
  const number = formatAddressNumber(a.addressNumber);
  const types = a.services.map((s) => t(`serviceTypes.${s.type}`)).join(', ');

  const sections = [
    [`Commande n° ${order.orderNumber}`, `Type de demande : ${t(`requestTypes.${requestType}`)}`],
    [`Client : ${order.firstName} ${order.lastName}`, `Courriel : ${order.email}`, `Téléphone : ${order.phone ?? '—'}`],
    [...addressLines(a), `Délai : ${formatServiceDelay(a.delay, a.requestedDate)}`],
    ...a.services.map((s) => {
      const lines = describeServiceDetailsText(s.type, s.details, t, 'fr');
      return [
        `${t(`serviceTypes.${s.type}`).toUpperCase()}`,
        ...(lines ?? ['Détails illisibles : voir la base de données.']),
      ];
    }),
    // Liens ouverts après connexion à l'espace superAdmin
    ...(a.attachments.length > 0
      ? [['PIÈCES JOINTES', ...a.attachments.map((f) => `${f.fileName} : ${SITE_URL}/api/attachments/${f.id}`)]]
      : []),
  ];

  return {
    subject: `[${number}] ${types} — ${shortAddress(a)}`,
    title: `${number} — ${types}`,
    sections,
  };
}

/**
 * Envoie le courriel de chaque numéro PE de la commande qui ne l'a pas encore reçu.
 * Ne lève jamais : un échec laisse la date vide, le cron le relance.
 */
export async function sendServiceAddressEmails(orderId: string): Promise<void> {
  let addresses: EmailAddress[];
  try {
    addresses = await prisma.serviceAddress.findMany({
      where: { serviceRequest: { orderId }, internalEmailSentAt: null },
      orderBy: { addressNumber: 'asc' },
      select: addressSelect,
    });
  } catch (err) {
    console.error('[service-email] Lecture des adresses impossible :', orderId, err);
    return;
  }

  // Une adresse à la fois : ménage le SMTP
  for (const address of addresses) {
    const number = formatAddressNumber(address.addressNumber);
    try {
      const email = buildServiceAddressEmail(address);
      await sendEmail({
        to: INTERNAL_EMAIL,
        replyTo: address.serviceRequest.order.email, // répondre écrit directement au client
        subject: email.subject,
        text: email.sections.map((lines) => lines.join('\n')).join('\n\n'),
        html: await renderTextEmail({ title: email.title, sections: email.sections, locale: 'fr' }),
      });
    } catch (err) {
      console.error('[service-email] Échec du courriel (relancé par le cron) :', number, err);
      continue;
    }
    try {
      await prisma.serviceAddress.update({ where: { id: address.id }, data: { internalEmailSentAt: new Date() } });
    } catch (err) {
      console.error('[service-email] Envoi non enregistré (doublon possible au prochain cron) :', number, err);
    }
  }
}
