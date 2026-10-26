'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { MAX_DIRECTIONALS, SIGN_MENTION_LABELS, SIGN_MENTIONS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { RadioGroup, toOptions } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import { PlacedUnitsFields } from '../PlacedUnitsFields';
import styles from '../installationForm.module.css';

const MENTION_OPTIONS = toOptions(SIGN_MENTIONS, SIGN_MENTION_LABELS);

export function DirectionalsSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails des directionnelles</h3>

      <Controller
        control={control}
        name="directionals.mention"
        render={(props) => (
          <RadioGroup
            {...bindField(props)}
            legend="Veuillez choisir la mention de la directionnelle"
            options={MENTION_OPTIONS}
            required
          />
        )}
      />

      <PlacedUnitsFields
        name="directionals.units"
        quantityLabel="Combien de directionnelles avez-vous besoin ?"
        unitLabel={(i) => `Veuillez indiquer l'emplacement de la directionnelle #${i + 1}`}
        placeholder="Ex. : Newman et Léger"
        max={MAX_DIRECTIONALS}
        maxLength={TEXT_LIMITS.directionalPlacement}
      />
    </section>
  );
}