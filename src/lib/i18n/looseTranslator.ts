import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import type { Locale } from '@/shared/constants/locales';
import frServices from '@/messages/fr/services.json';
import enServices from '@/messages/en/services.json';

export type LooseTranslator = ((key: string, values?: Record<string, string | number>) => string) & {
  has: (key: string) => boolean;
};

/**
 * Traducteur hors requête (courriels envoyés par le webhook Stripe ou le cron), aux clés libres :
 * elles sont construites à l'exécution à partir des valeurs en base (type de service, slug…).
 */
export function looseTranslator(locale: Locale, messages: AbstractIntlMessages): LooseTranslator {
  const t = createTranslator({ locale, messages });
  type Key = Parameters<typeof t>[0];
  type Values = Parameters<typeof t>[1];
  const translate = (key: string, values?: Record<string, string | number>) => t(key as Key, values as Values);
  return Object.assign(translate, { has: (key: string) => t.has(key as Key) });
}

const SERVICES_MESSAGES: Record<Locale, AbstractIntlMessages> = { fr: frServices, en: enServices };

/** Namespace « services », mêmes libellés que le site */
export const servicesTranslator = (locale: Locale): LooseTranslator => looseTranslator(locale, SERVICES_MESSAGES[locale]);
