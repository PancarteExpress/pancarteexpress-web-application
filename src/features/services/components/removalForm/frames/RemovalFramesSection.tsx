'use client';

import { useId } from 'react';
import { useFieldArray, useFormState, useWatch } from 'react-hook-form';
import { MAX_REMOVAL_FRAMES } from '@/features/services/constants/removal';
import { createRemovalFrameUnit } from '@/features/services/schemas/removal.schema';
import { QuantityField } from '@/features/services/components/fields';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useRemovalFormContext, useRemovalUpdater } from '../formContext';
import styles from '../../installationForm/installationForm.module.css';

export function RemovalFramesSection() {
  const headingId = useId();
  const { control } = useRemovalFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'frames.units' });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createRemovalFrameUnit), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails du retrait de pancartes</h3>

      <QuantityField
        label="Combien de pancartes voulez-vous retirer ?"
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_REMOVAL_FRAMES}
        hint={`Max ${MAX_REMOVAL_FRAMES}`}
      />

      {fields.map((field, index) => (
        <RemovalFrameUnitFields key={field.id} index={index} />
      ))}
    </section>
  );
}

function RemovalFrameUnitFields({ index }: { index: number }) {
  const path = `frames.units.${index}.placement` as const;
  const { control } = useRemovalFormContext();
  const update = useRemovalUpdater();
  const placement = useWatch({ control, name: path });
  const { errors } = useFormState({ control, name: path });

  return (
    <fieldset className={styles.unit}>
      <legend className={styles.unitTitle}>Pancarte #{index + 1}</legend>
      <PlacementPicker
        legend="Veuillez indiquer l'emplacement du retrait"
        value={placement}
        onChange={(next) => update(path, next)}
        errors={toPlacementErrors(errors.frames?.units?.[index]?.placement)}
      />
    </fieldset>
  );
}