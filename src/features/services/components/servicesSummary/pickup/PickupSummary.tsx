import { useTranslations } from 'next-intl';
import type { PickupDetails } from '@/features/services/types/pickup';
import styles from '../servicesSummary.module.css';
import { Field, Fields, Pill, Prose } from '../SummaryParts';

export function PickupSummary({ details }: { details: PickupDetails }) {
  const t = useTranslations('services');
  return (
    <div className={styles.installation}>
      <Fields>
        <Field label={t('summary.toPickup')}>
          {details.materials.map((m) => t(`pickup.materials.${m}`)).join(', ')}
        </Field>
        <Field label={t('summary.newModels')}>
          {details.newModels ? <Pill tone="success">{t('common.yes')}</Pill> : t('common.no')}
        </Field>
      </Fields>
      {details.details && <Prose>{details.details}</Prose>}
    </div>
  );
}
