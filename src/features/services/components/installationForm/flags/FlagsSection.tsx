'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { FLAG_MENTIONS, MAX_FLAGS, SIGN_MENTION_LABELS } from '@/features/services/constants/installation';
import { QuantityField, RadioGroup, toOptions } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

const FLAG_MENTION_OPTIONS = toOptions(FLAG_MENTIONS, SIGN_MENTION_LABELS);

export function FlagsSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails des drapeaux</h3>

      <Controller
        control={control}
        name="flags.mention"
        render={(props) => (
          <RadioGroup
            {...bindField(props)}
            legend="Veuillez choisir la mention du drapeau"
            options={FLAG_MENTION_OPTIONS}
            columns={2}
            required
          />
        )}
      />

      <Controller
        control={control}
        name="flags.quantity"
        render={({ field, fieldState }) => (
          <QuantityField
            label="Combien de drapeaux devons-nous installer ?"
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_FLAGS}
            hint={`Max ${MAX_FLAGS}`}
            error={fieldState.error?.message}
          />
        )}
      />
    </section>
  );
}