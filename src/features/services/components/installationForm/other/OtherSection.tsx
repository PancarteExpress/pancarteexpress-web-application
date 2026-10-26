'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { TEXT_LIMITS } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

export function OtherSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Autres besoins</h3>

      <Controller
        control={control}
        name="otherNeeds"
        render={(props) => (
          <TextField
            {...bindField(props)}
            label="Veuillez préciser vos besoins d'installation"
            maxLength={TEXT_LIMITS.otherNeeds}
            multiline
            rows={4}
            required
          />
        )}
      />
    </section>
  );
}