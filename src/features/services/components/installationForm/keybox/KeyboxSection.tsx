'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { KEYBOX_CODE_MAX_DIGITS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

export function KeyboxSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails de la boîte à clés</h3>

      <Controller
        control={control}
        name="keybox.code"
        render={(props) => (
          <TextField
            {...bindField(props)}
            // Chiffres seulement, longueur maximale imposée à la saisie
            onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
            label="Veuillez indiquer le code de la boîte à clés"
            placeholder="Entrez le code ici…"
            inputMode="numeric"
            hint={`${KEYBOX_CODE_MAX_DIGITS} chiffres maximum.`}
            required
          />
        )}
      />

      <Controller
        control={control}
        name="keybox.placement"
        render={(props) => (
          <TextField
            {...bindField(props)}
            label="Veuillez indiquer l'emplacement de la boîte à clés"
            maxLength={TEXT_LIMITS.keyboxPlacement}
            multiline
            rows={2}
          />
        )}
      />
    </section>
  );
}