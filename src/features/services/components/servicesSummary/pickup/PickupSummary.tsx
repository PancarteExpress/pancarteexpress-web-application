import { useTranslations } from 'next-intl';
import type { PickupDetails } from '@/features/services/types/pickup';
import styles from '../servicesSummary.module.css';

export function PickupSummary({ details }: { details: PickupDetails }) {
  const t = useTranslations('services');
  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>{t('summary.toPickup')}</dt>
        <dd>{details.materials.map((m) => t(`pickup.materials.${m}`)).join(', ')}</dd>
        <dt>{t('summary.newModels')}</dt>
        <dd>{details.newModels ? t('common.yes') : t('common.no')}</dd>
      </dl>
      {details.details && <p className={styles.prose}>{details.details}</p>}
    </div>
  );
}