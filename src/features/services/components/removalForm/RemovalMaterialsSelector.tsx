'use client';

import { Controller } from 'react-hook-form';
import {
  EXCLUSIVE_REMOVAL_MATERIALS, IMPLEMENTED_REMOVAL_MATERIALS, REMOVAL_MATERIAL_LABELS, REMOVAL_MATERIALS,
  type ImplementedRemovalMaterial, type RemovalMaterial,
} from '@/features/services/constants/removal';
import { createRemovalDirectional, createRemovalUnit } from '@/features/services/schemas/removal.schema';
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
          const toggled = (m: ImplementedRemovalMaterial) => field.value.includes(m) !== materials.includes(m);
          const isOn = (m: ImplementedRemovalMaterial) => materials.includes(m);

          // Cocher ou décocher repart toujours de zéro ; les unités démarrent à 1
          if (toggled('frames')) update('frames', { units: isOn('frames') ? [createRemovalUnit()] : [] });
          if (toggled('addons')) update('addons', { units: isOn('addons') ? [createRemovalUnit()] : [], details: '' });
          if (toggled('keybox')) update('keybox', { quantity: 1, code: '', placement: '' });
          if (toggled('flags')) update('flags', { quantity: 1, placement: '' });
          if (toggled('directional')) {
            update('directionals', { units: isOn('directional') ? [createRemovalDirectional()] : [] });
          }
          if (toggled('other')) update('otherDetails', '');

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