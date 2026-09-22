import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';

const LOCALES = ['fr', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'fr';

type Messages = Record<string, unknown>;
type Loader = (locale: Locale) => Promise<{ default: Messages }>;

// Un nouveau namespace = une ligne ici
const LOADERS = {
  header: (locale) => import(`@/messages/${locale}/header.json`),
  cart: (locale) => import(`@/messages/${locale}/cart.json`),
} satisfies Record<string, Loader>;

type Namespace = keyof typeof LOADERS;

async function loadNamespace(locale: Locale, namespace: Namespace): Promise<Messages> {
  try {
    return (await LOADERS[namespace](locale)).default;
  } catch (error) {
    if (locale !== DEFAULT_LOCALE) return loadNamespace(DEFAULT_LOCALE, namespace);
    console.error(`[i18n] Impossible de charger messages/${locale}/${namespace}.json`, error);
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(LOCALES, requested) ? requested : DEFAULT_LOCALE;

  const namespaces = Object.keys(LOADERS) as Namespace[];
  const entries = await Promise.all(
    namespaces.map(async (ns) => [ns, await loadNamespace(locale, ns)] as const),
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
    timeZone: 'America/Toronto',
  };
});