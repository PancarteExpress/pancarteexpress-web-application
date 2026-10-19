'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { KEYBOX_CODE_MAX_DIGITS, MAX_KEYBOXES, TEXT_LIMITS } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import { PlacedUnitsFields } from '../PlacedUnitsFields';
import styles from '../installationForm.module.css';

export function KeyboxSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails des boîtes à clés</h3>

      <Controller
        control={control}
        name="keybox.code"
        render={(props) => (
          <TextField
            {...bindField(props)}
            // Chiffres seulement, longueur maximale imposée à la saisie
            onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
            label="Veuillez indiquer le code des boîtes à clés"
            placeholder="Entrez le code ici…"
            inputMode="numeric"
            hint={`Un seul code pour toutes les boîtes, ${KEYBOX_CODE_MAX_DIGITS} chiffres maximum.`}
            required
          />
        )}
      />

      <PlacedUnitsFields
        name="keybox.units"
        quantityLabel="Combien de boîtes à clés voulez-vous installer ?"
        unitLabel={(i) => `Veuillez indiquer l'emplacement de la boîte à clés #${i + 1}`}
        max={MAX_KEYBOXES}
        maxLength={TEXT_LIMITS.keyboxPlacement}
      />
    </section>
  );
}