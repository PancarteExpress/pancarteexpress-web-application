import { CORRECTION_KIND_LABELS } from '@/features/services/constants/correction';
import type { CorrectionDetails } from '@/features/services/types/correction';
import styles from '../servicesSummary.module.css';

export function CorrectionSummary({ details }: { details: CorrectionDetails }) {
  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>Type</dt>
        <dd>{CORRECTION_KIND_LABELS[details.kind]}</dd>
      </dl>
      {details.kind === 'explain' && <p className={styles.prose}>{details.explanation}</p>}
    </div>
  );
}