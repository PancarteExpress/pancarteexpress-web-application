'use client';

import { Controller } from 'react-hook-form';
import {
  EXCLUSIVE_REMOVAL_MATERIALS, IMPLEMENTED_REMOVAL_MATERIALS, REMOVAL_MATERIAL_LABELS, REMOVAL_MATERIALS,
  type ImplementedRemovalMaterial, type RemovalMaterial,
} from '@/features/services/constants/removal';
import { createRemovalFrameUnit } from '@/features/services/schemas/removal.schema';
import { CheckboxGroup, type ChoiceOption } from '@/features/services/components/fields';
import { useRemovalFormContext, useRemovalUpdater } from './formContext';

const IMPLEMENTED: readonly RemovalMaterial[] = IMPLEMENTED_REMOVAL_MATERIALS;
const isImplemented = (m: RemovalMaterial): m is ImplementedRemovalMaterial => IMPLEMENTED.includes(m);

/** Matériels incompatibles avec `m` */
const partnersOf = (m: RemovalMaterial): RemovalMaterial[] =>
  EXCLUSIVE_REMOVAL_MATERIALS.flatMap(([a, b]) => (a === m ? [b] : b === m ? [a] : []));

export function RemovalMaterialsSelector() {
  const { control } = useRemovalFormContext();
  const update = useRemovalUpdater();

  return (
    <Controller
      control={control}
      name="materials"
      render={({ field, fieldState }) => {
        const selected: readonly RemovalMaterial[] = field.value;

        const options = REMOVAL_MATERIALS.map((m): ChoiceOption<RemovalMaterial> => ({
          value: m,
          label: REMOVAL_MATERIAL_LABELS[m],
          // Non implémenté, ou exclu par un matériel déjà coché (ex. Pancarte ↔ Ajouts)
          disabled: !isImplemented(m) || partnersOf(m).some((p) => selected.includes(p)),
        }));

        const handleChange = (next: RemovalMaterial[]) => {
          const materials = next.filter(isImplemented);
          const hadFrames = field.value.includes('frames');
          const hasFrames = materials.includes('frames');
          if (hadFrames !== hasFrames) {
            update('frames', { units: hasFrames ? [createRemovalFrameUnit()] : [] });
          }
          field.onChange(materials);
        };

        return (
          <CheckboxGroup
            legend="Qu'avez-vous besoin de retirer ?"
            options={options}
            value={field.value}
            onChange={handleChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            hint="Les autres éléments seront offerts prochainement."
            required
          />
        );
      }}
    />
  );
}