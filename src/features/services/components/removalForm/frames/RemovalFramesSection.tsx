'use client';

import { useId } from 'react';
import { MAX_REMOVAL_FRAMES } from '@/features/services/constants/removal';
import { RemovalUnitsFields } from '../RemovalUnitsFields';
import styles from '../../installationForm/installationForm.module.css';

export function RemovalFramesSection() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails du retrait de pancartes</h3>
      <RemovalUnitsFields
        name="frames.units"
        quantityLabel="Combien de pancartes voulez-vous retirer ?"
        unitName="Pancarte"
        max={MAX_REMOVAL_FRAMES}
      />
    </section>
  );
}