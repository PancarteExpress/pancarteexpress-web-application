'use client';

import { useId } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useFormUpdater, useInstallationFormContext } from './formContext';
import styles from './installationForm.module.css';

/** Emplacement unique de l'installation, commun à tous les matériels. */
export function PlacementFields() {
  const headingId = useId();
  const t = useTranslations('services.installation');
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const placement = useWatch({ control, name: 'placement' });
  const { errors } = useFormState({ control, name: 'placement' });

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{t('placementTitle')}</h3>
      <PlacementPicker
        legend={t('placementLegend')}
        value={placement}
        onChange={(next) => update('placement', next)}
        errors={toPlacementErrors(errors.placement)}
      />
    </section>
  );
}