import type { Locale } from '@/shared/constants/locales';
import { parseIso } from './holidays';

/** Jour local affiché dans la langue de l'interface : « samedi 24 octobre 2026 », « Saturday, October 24, 2026 » */
export const formatDay = (date: Date, locale: Locale, withYear = true): string =>
  date.toLocaleDateString(`${locale}-CA`, {
    weekday: 'long', day: 'numeric', month: 'long', ...(withYear && { year: 'numeric' }),
  });

/** Même affichage depuis une date 'yyyy-MM-dd' */
export const formatIsoDay = (iso: string, locale: Locale, withYear = true): string =>
  formatDay(parseIso(iso), locale, withYear);
