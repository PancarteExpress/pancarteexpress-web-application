// shared/hooks/useAppLocale.ts
import { useLocale, hasLocale } from 'next-intl';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/shared/constants/locales';

export function useAppLocale(): Locale {
  const locale = useLocale();
  return hasLocale(LOCALES, locale) ? locale : DEFAULT_LOCALE;
}