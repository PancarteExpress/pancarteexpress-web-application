import 'server-only';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import type { Locale, ServiceDelay } from '@prisma/client';
import { formatCents } from '@/lib/pricing/money';
import { formatServiceDate } from '@/lib/orders/serviceDelay';
import { CONTACT } from '@/shared/constants/contact';
import { formatAddressNumber } from '@/lib/services/addressNumber';
import { LARGE_FORMAT_SERVICES } from '@/features/services/constants/largeFormat';
import { parseLargeFormatService } from '@/features/services/schemas/largeFormatDomain.schema';
import {
  describeLargeFormatServiceTranslated,
  type ServicesTranslator,
} from '@/features/services/utils/largeFormatTranslatedText';
import frServices from '@/messages/fr/services.json';
import enServices from '@/messages/en/services.json';
import frProducts from '@/messages/fr/products.json';
import enProducts from '@/messages/en/products.json';
import type { Receipt, ReceiptAddress } from './receipts.email';

/*
 * Confirmation de commande envoyée au client invité, dans la langue de son checkout (Order.locale).
 * Le reçu interne, lui, reste en français (receipts.email.ts).
 * Libellés des services et des produits : mêmes traductions que le site (messages/*.json),
 * chargées directement car l'envoi peut venir du webhook Stripe ou du cron, sans requête du client.
 */

// Non typé : les clés sont construites à partir des valeurs en base (type de service, slug…)
const MESSAGES: Record<Locale, { services: AbstractIntlMessages; products: AbstractIntlMessages }> = {
  fr: { services: frServices, products: frProducts },
  en: { services: enServices, products: enProducts },
};

const TEXT = {
  fr: {
    subject: (n: number) => `Confirmation de votre commande n° ${n} | Pancarte Express`,
    title: 'Confirmation de commande',
    greeting: (name: string) => `Bonjour ${name},`,
    thanks: (n: number) => `Merci pour votre commande n° ${n}. En voici le récapitulatif.`,
    delivery: 'Livraison',
    pickup: 'Ramassage',
    products: 'Produits :',
    subtotal: 'Sous-total',
    tps: 'TPS',
    tvq: 'TVQ',
    total: 'Total',
    totalProductsOnly: 'Total (produits seulement)',
    services: 'Services (prix sur soumission) :',
    delay: 'Délai',
    delays: { standard24h: 'Standard 24 h', urgent12h: 'Urgence 12 h', sameDay: 'Urgence jour même', specificDate: 'Date précise' },
    onDate: (date: string) => `Le ${date}`,
    noDelay: 'Aucun délai (grand format)',
    apartment: (apt: string) => `, app. ${apt}`,
    terrain: 'Terrain',
    near: (address: string) => ` (près du ${address})`,
    unreadable: 'détails non disponibles',
    pricedProducts:
      "Le montant payé couvre uniquement les produits. Le prix des services n'y est pas inclus : il vous sera communiqué par soumission.",
    pricedNothing: "Aucun montant ne vous a été facturé pour le moment : le prix des services vous sera communiqué par soumission.",
    colon: ' : ',
    dateLocale: 'fr-CA',
  },
  en: {
    subject: (n: number) => `Your order #${n} confirmation | Pancarte Express`,
    title: 'Order confirmation',
    greeting: (name: string) => `Hello ${name},`,
    thanks: (n: number) => `Thank you for your order #${n}. Here is your summary.`,
    delivery: 'Delivery',
    pickup: 'Pickup',
    products: 'Products:',
    subtotal: 'Subtotal',
    tps: 'GST',
    tvq: 'QST',
    total: 'Total',
    totalProductsOnly: 'Total (products only)',
    services: 'Services (priced on quote):',
    delay: 'Turnaround',
    delays: { standard24h: 'Standard 24 h', urgent12h: 'Urgent 12 h', sameDay: 'Same-day urgent', specificDate: 'Specific date' },
    onDate: (date: string) => `On ${date}`,
    noDelay: 'No turnaround (large format)',
    apartment: (apt: string) => `, apt. ${apt}`,
    terrain: 'Terrain',
    near: (address: string) => ` (near ${address})`,
    unreadable: 'details unavailable',
    pricedProducts:
      'The amount paid covers the products only. Service prices are not included: they will be sent to you in a quote.',
    pricedNothing: 'You have not been charged anything yet: service prices will be sent to you in a quote.',
    colon: ': ',
    dateLocale: 'en-CA',
  },
} satisfies Record<Locale, unknown>;

type Text = (typeof TEXT)[Locale];

type LooseTranslator = ServicesTranslator & { has: (key: string) => boolean };

/** Traducteur aux clés libres : elles sont construites à l'exécution (type de service, slug…) */
function looseTranslator(locale: Locale, messages: AbstractIntlMessages): LooseTranslator {
  const t = createTranslator({ locale, messages });
  type Key = Parameters<typeof t>[0];
  type Values = Parameters<typeof t>[1];
  const translate = (key: string, values?: Record<string, string | number>) => t(key as Key, values as Values);
  return Object.assign(translate, { has: (key: string) => t.has(key as Key) });
}

const LARGE_FORMAT_SET: ReadonlySet<string> = new Set(LARGE_FORMAT_SERVICES);

export interface ClientReceipt {
  subject: string;
  title: string;
  sections: string[][];
}

function formatDelay(delay: ServiceDelay | null, requestedDate: Date | null, l: Text): string {
  if (delay === null) return l.noDelay;
  return delay === 'specificDate' && requestedDate ? l.onDate(formatServiceDate(requestedDate, l.dateLocale)) : l.delays[delay];
}

function formatAddress(address: ReceiptAddress, l: Text): string {
  if (address.kind === 'civicAddress') {
    const apt = address.apartment ? l.apartment(address.apartment) : '';
    return `${address.streetNumber ?? ''} ${address.streetName ?? ''}${apt}, ${address.city}`.trim();
  }
  const near = address.nearbyAddress ? l.near(address.nearbyAddress) : '';
  return `${l.terrain}${l.colon}${address.description ?? ''}, ${address.city}${near}`;
}

export function buildClientReceipt(order: Receipt): ClientReceipt {
  const locale = order.locale;
  const l = TEXT[locale];
  const tServices = looseTranslator(locale, MESSAGES[locale].services);
  const tProducts = looseTranslator(locale, MESSAGES[locale].products);
  const money = (cents: number) => formatCents(cents, locale);

  // Nom traduit depuis le slug ; nom figé de la commande si le produit a quitté le catalogue
  const productName = (p: Receipt['products'][number]) =>
    tProducts.has(`${p.productSlug}.name`) ? tProducts(`${p.productSlug}.name`) : p.productName;

  const hasProducts = order.products.length > 0;
  const hasServices = order.serviceRequests.length > 0;

  const delivery = !hasProducts
    ? []
    : order.deliveryMode === 'DELIVERY'
      ? [`${l.delivery}${l.colon}${order.deliveryStreet}, ${order.deliveryCity} ${order.deliveryPostalCode ?? ''}`.trim()]
      : [`${l.pickup}${l.colon}${CONTACT.address}`];

  const products = !hasProducts
    ? []
    : [
        l.products,
        ...order.products.map((p) => `- ${productName(p)} ×${p.quantity}${l.colon}${money(p.unitPrice * p.quantity)}`),
        '',
        `${l.subtotal}${l.colon}${money(order.subtotal)}`,
        `${l.tps}${l.colon}${money(order.tps)}`,
        `${l.tvq}${l.colon}${money(order.tvq)}`,
        `${hasServices ? l.totalProductsOnly : l.total}${l.colon}${money(order.total)}`,
      ];

  const largeFormatDetails = (service: ReceiptAddress['services'][number]): string[] => {
    if (!LARGE_FORMAT_SET.has(service.type)) return [];
    const parsed = parseLargeFormatService(service.type, service.details);
    const title = `    ${tServices(`serviceTypes.${service.type}`)}`;
    if (!parsed) return [`${title}${l.colon}${l.unreadable}`];
    return [`${title}${l.colon.trimEnd()}`, ...describeLargeFormatServiceTranslated(parsed, tServices).map((line) => `      ${line}`)];
  };

  const services = !hasServices
    ? []
    : [
        l.services,
        ...order.serviceRequests.flatMap((request) =>
          request.addresses.flatMap((address) => [
            `- ${formatAddressNumber(address.addressNumber)} [${tServices(`requestTypes.${request.requestType}`)}] ${formatAddress(address, l)}${l.colon}` +
              address.services.map((s) => tServices(`serviceTypes.${s.type}`)).join(', '),
            `    ${l.delay}${l.colon}${formatDelay(address.delay, address.requestedDate, l)}`,
            ...address.services.flatMap(largeFormatDetails),
          ]),
        ),
      ];

  const pricingNote = hasServices ? [hasProducts ? l.pricedProducts : l.pricedNothing] : [];

  return {
    subject: l.subject(order.orderNumber),
    title: l.title,
    sections: [
      [l.greeting(order.firstName), '', l.thanks(order.orderNumber)],
      delivery,
      products,
      services,
      pricingNote,
    ].filter((section) => section.length > 0),
  };
}
