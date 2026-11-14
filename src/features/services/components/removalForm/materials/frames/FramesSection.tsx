'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { MAX_REMOVAL_FRAMES } from '@/features/services/constants/removal';
import { UnitPlacementField } from '../../placementFields/unitPlacementFields';
import styles from '../../../installationForm/installationForm.module.css';

import { FaSignHanging } from "react-icons/fa6";

export function FramesSection() {
  const headingId = useId();
  const t = useTranslations('services.removal');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><FaSignHanging size={24} /> {t('framesTitle')}</h3>
      <UnitPlacementField
        name="frames.units"
        quantityLabel={t('framesQuantity')}
        unitName={t('frameUnit')}
        max={MAX_REMOVAL_FRAMES}
      />
    </section>
  );
}