import { useTranslations } from 'next-intl';
import { formatServiceDate, isoToUtcDate } from '@/lib/orders/serviceDelay';
import type { ServiceSchedule } from '@/features/services/types/schedule';

/** Texte d'un délai (ex. « Délai : urgence 12 h ») ; null = grand format, sans délai */
export function useDelayText(locale: string) {
  const t = useTranslations('cart');
  return (schedule: ServiceSchedule | null): string => {
    if (schedule === null) return t('delay.none');
    if (schedule.delay === 'specificDate') {
      return t('delay.specificDate', {
        date: formatServiceDate(isoToUtcDate(schedule.date), locale === 'en' ? 'en-CA' : 'fr-CA'),
      });
    }
    return t(`delay.${schedule.delay}`);
  };
}
