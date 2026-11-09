import { useTranslations } from 'next-intl';
import type { CorrectionDetails } from '@/features/services/types/correction';
import styles from '../servicesSummary.module.css';

export function CorrectionSummary({ details }: { details: CorrectionDetails }) {
  const t = useTranslations('services');
  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>{t('summary.type')}</dt>
        <dd>{t(`correction.kinds.${details.kind}`)}</dd>
      </dl>
      {details.kind === 'explain' && <p className={styles.prose}>{details.explanation}</p>}
    </div>
  );
}