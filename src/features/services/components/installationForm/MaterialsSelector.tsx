'use client';

import { Controller } from 'react-hook-form';
import {
  FRAME_BUNDLED_MATERIALS, IMPLEMENTED_MATERIALS, MATERIAL_LABELS, MATERIALS,
  type ImplementedMaterial, type Material,
} from '../../constants/installation';
import { createFrameUnit } from '../../schemas/installation.schema';
import { CheckboxGroup, Notice, type ChoiceOption } from '../fields';
import { bindField, useFormUpdater, useInstallationFormContext } from './formContext';

const IMPLEMENTED: readonly Material[] = IMPLEMENTED_MATERIALS;
const BUNDLED: readonly Material[] = FRAME_BUNDLED_MATERIALS;

const isImplemented = (m: Material): m is ImplementedMaterial => IMPLEMENTED.includes(m);

export function MaterialsSelector() {
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();

  return (
    <Controller
      control={control}
      name="materials"
      render={(props) => {
        const current = props.field.value;
        const hasFrames = current.includes('frames');

        const options = MATERIALS.map((m): ChoiceOption<Material> => ({
          value: m,
          label: MATERIAL_LABELS[m],
          locked: hasFrames && BUNDLED.includes(m),
          disabled: !isImplemented(m),
        }));

        // Effets de bord déclenchés au clic, pas dans un useEffect
        const handleChange = (next: Material[]) => {
          const materials = next.filter(isImplemented);
          const nextHasFrames = materials.includes('frames');

          if (nextHasFrames !== hasFrames) {
            update('frames', {
              pickup: null,
              pickupAddress: '',
              units: nextHasFrames ? [createFrameUnit()] : [],
            });
            if (!nextHasFrames) {
              update('addons', getValues('addons').map((a) => ({ ...a, frameUids: [] })));
            }
          }
          if (current.includes('addons') && !materials.includes('addons')) update('addons', []);

          props.field.onChange(materials);
        };

        return (
          <>
            <CheckboxGroup
              {...bindField(props)}
              onChange={handleChange}
              legend="Qu'avez-vous besoin d'installer ?"
              options={options}
              hint="Les autres éléments seront offerts prochainement."
              required
            />
            {hasFrames && (
              <Notice variant="warning">
                Les installations de pancartes incluent l&apos;installation des ancrages et des poteaux.
              </Notice>
            )}
          </>
        );
      }}
    />
  );
}