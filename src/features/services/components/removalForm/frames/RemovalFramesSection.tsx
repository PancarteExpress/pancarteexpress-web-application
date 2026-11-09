'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { MAX_REMOVAL_FRAMES } from '@/features/services/constants/removal';
import { RemovalUnitsFields } from '../RemovalUnitsFields';
import styles from '../../installationForm/installationForm.module.css';

export function RemovalFramesSection() {
  const headingId = useId();
  const t = useTranslations('services.removal');

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{t('framesTitle')}</h3>
      <RemovalUnitsFields
        name="frames.units"
        quantityLabel={t('framesQuantity')}
        unitName={t('frameUnit')}
        max={MAX_REMOVAL_FRAMES}
      />
    </section>
  );
}