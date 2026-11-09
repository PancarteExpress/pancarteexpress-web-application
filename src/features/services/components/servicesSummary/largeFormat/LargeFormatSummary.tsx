import { useTranslations } from 'next-intl';
import type { LargeFormatService } from '@/features/services/types/services';
import { describeLargeFormatServiceTranslated } from '@/features/services/utils/largeFormatTranslatedText';
import styles from '../servicesSummary.module.css';

/**
 * Détails d'un service grand format : mêmes lignes que le courriel interne (utils/largeFormatText,
 * en français pour l'équipe), mais dans la langue de l'interface.
 */
export function LargeFormatSummary({ service }: { service: LargeFormatService }) {
  const t = useTranslations('services');

  return (
    <ul className={styles.inlineList}>
      {describeLargeFormatServiceTranslated(service, t).map((line, i) => (
        <li key={`${i}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}
