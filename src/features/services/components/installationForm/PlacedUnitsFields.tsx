'use client';

import { Controller, useFieldArray } from 'react-hook-form';
import { createPlacedUnit } from '@/features/services/schemas/installation.schema';
import { QuantityField, TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from './formContext';

type PlacedUnitsPath = 'directionals.units';

interface PlacedUnitsFieldsProps {
  name: PlacedUnitsPath;
  quantityLabel: string;
  unitLabel: (index: number) => string;
  max: number;
  maxLength: number;
  placeholder?: string;
}

/** Quantité + un emplacement par unité (directionnelles). */
export function PlacedUnitsFields({ name, quantityLabel, unitLabel, max, maxLength, placeholder, }: PlacedUnitsFieldsProps) {
  const { control } = useInstallationFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createPlacedUnit), { shouldFocus: false });
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
        <Controller
          key={field.id}
          control={control}
          name={`${name}.${index}.placement`}
          render={(props) => (
            <TextField
              {...bindField(props)}
              label={unitLabel(index)}
              maxLength={maxLength}
              placeholder={placeholder}
              multiline
              rows={1}
            />
          )}
        />
      ))}
    </>
  );
}