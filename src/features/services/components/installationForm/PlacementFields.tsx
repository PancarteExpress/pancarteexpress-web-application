'use client';

import { useId } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useFormUpdater, useInstallationFormContext } from './formContext';
import styles from './installationForm.module.css';

/** Emplacement unique de l'installation, commun à tous les matériels. */
export function PlacementFields() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const placement = useWatch({ control, name: 'placement' });
  const { errors } = useFormState({ control, name: 'placement' });

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Emplacement de l&apos;installation</h3>
      <PlacementPicker
        legend="Veuillez indiquer l'emplacement d'installation"
        value={placement}
        onChange={(next) => update('placement', next)}
        errors={toPlacementErrors(errors.placement)}
      />
    </section>
  );
}