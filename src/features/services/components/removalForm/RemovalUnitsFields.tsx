'use client';

import { useFieldArray, useFormState, useWatch } from 'react-hook-form';
import { createRemovalUnit } from '@/features/services/schemas/removal.schema';
import { QuantityField } from '@/features/services/components/fields';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useRemovalFormContext, useRemovalUpdater } from './formContext';
import styles from '../installationForm/installationForm.module.css';

type UnitsPath = 'frames.units' | 'addons.units';

interface RemovalUnitsFieldsProps {
  name: UnitsPath;
  quantityLabel: string;
  /** Ex. « Pancarte », « Ajout » → « Pancarte #1 » */
  unitName: string;
  max: number;
}

export function RemovalUnitsFields({ name, quantityLabel, unitName, max }: RemovalUnitsFieldsProps) {
  const { control } = useRemovalFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createRemovalUnit), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <>
      <QuantityField
        label={quantityLabel}
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={max}
        hint={`Max ${max}`}
      />
      {fields.map((field, index) => (
        <RemovalUnitFields key={field.id} name={name} index={index} title={`${unitName} #${index + 1}`} />
      ))}
    </>
  );
}

function RemovalUnitFields({ name, index, title }: { name: UnitsPath; index: number; title: string }) {
  const path = `${name}.${index}.placement` as const;
  const { control } = useRemovalFormContext();
  const update = useRemovalUpdater();
  const placement = useWatch({ control, name: path });
  const { errors } = useFormState({ control, name: path });

  const placementErrors =
    name === 'frames.units' ? errors.frames?.units?.[index]?.placement : errors.addons?.units?.[index]?.placement;

  return (
    <fieldset className={styles.unit}>
      <legend className={styles.unitTitle}>{title}</legend>
      <PlacementPicker
        legend="Veuillez indiquer l'emplacement du retrait"
        value={placement}
        onChange={(next) => update(path, next)}
        errors={toPlacementErrors(placementErrors)}
      />
    </fieldset>
  );
}