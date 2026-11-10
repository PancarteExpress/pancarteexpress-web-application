import { useTranslations } from 'next-intl';
import type { CorrectionDetails } from '@/features/services/types/correction';
import styles from '../servicesSummary.module.css';
import { Field, Fields, Pill, Prose } from '../SummaryParts';

export function CorrectionSummary({ details }: { details: CorrectionDetails }) {
  const t = useTranslations('services');
  return (
    <div className={styles.installation}>
      <Fields>
        <Field label={t('summary.type')} wide>
          <Pill>{t(`correction.kinds.${details.kind}`)}</Pill>
        </Field>
      </Fields>
      {details.kind === 'explain' && <Prose>{details.explanation}</Prose>}
    </div>
  );
}
