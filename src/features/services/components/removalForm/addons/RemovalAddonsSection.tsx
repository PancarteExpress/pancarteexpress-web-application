'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { MAX_REMOVAL_ADDONS, REMOVAL_TEXT_LIMITS } from '@/features/services/constants/removal';
import { TextField } from '@/features/services/components/fields';
import { useRemovalFormContext } from '../formContext';
import { RemovalUnitsFields } from '../RemovalUnitsFields';
import styles from '../../installationForm/installationForm.module.css';

export function RemovalAddonsSection() {
  const headingId = useId();
  const { control } = useRemovalFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails du retrait d&apos;ajouts</h3>

      <RemovalUnitsFields
        name="addons.units"
        quantityLabel="Combien d'ajouts voulez-vous retirer ?"
        unitName="Ajout"
        max={MAX_REMOVAL_ADDONS}
      />

      <Controller
        control={control}
        name="addons.details"
        render={({ field, fieldState }) => (
          <TextField
            label="Précision sur l'ajout à retirer"
            placeholder="Veuillez préciser l'ajout à retirer s'il y en a plusieurs…"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            maxLength={REMOVAL_TEXT_LIMITS.addonsDetails}
            multiline
            rows={2}
            error={fieldState.error?.message}
          />
        )}
      />
    </section>
  );
}