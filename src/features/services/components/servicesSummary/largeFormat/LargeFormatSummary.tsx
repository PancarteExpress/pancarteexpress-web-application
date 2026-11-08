import type { LargeFormatService } from '@/features/services/types/services';
import { describeLargeFormatService } from '@/features/services/utils/largeFormatText';
import styles from '../servicesSummary.module.css';

/** Détails d'un service grand format : même texte que dans le courriel interne */
export function LargeFormatSummary({ service }: { service: LargeFormatService }) {
  return (
    <ul className={styles.inlineList}>
      {describeLargeFormatService(service).map((line, i) => (
        <li key={`${i}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}
