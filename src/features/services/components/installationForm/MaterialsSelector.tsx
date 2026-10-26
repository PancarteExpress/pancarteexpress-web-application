'use client';

import { Controller } from 'react-hook-form';
import {
  FRAME_BUNDLED_MATERIALS, IMPLEMENTED_MATERIALS, MATERIAL_LABELS, MATERIALS,
  type ImplementedMaterial, type Material,
} from '../../constants/installation';
import {
  createEmptyOpenHouse, createFrameUnit, createKitUnit, createPlacedUnit,
} from '@/features/services/schemas/installation.schema';
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
          const selected = next.filter(isImplemented);
          const nextHasFrames = selected.includes('frames');
          // Avec des pancartes, le kit est inclus : le kit seul et ses détails sont retirés
          const materials = nextHasFrames ? selected.filter((m) => m !== 'kit') : selected;


          if (nextHasFrames !== hasFrames) {
            update('frames', {
              pickup: null,
              pickupAddress: '',
              units: nextHasFrames ? [createFrameUnit()] : [],
            });
            if (!nextHasFrames) {
              update('addons', getValues('addons').map((a) => ({ ...a, frameUids: [] })));
              update('openHouse.frameUids', []);
            }
          }

          const hadKit = current.includes('kit');
          const hasKit = materials.includes('kit');
          if (hadKit !== hasKit) update('kits', { units: hasKit ? [createKitUnit()] : [] });
          if (current.includes('addons') && !materials.includes('addons')) update('addons', []);
          if (current.includes('openHouse') !== materials.includes('openHouse')) {
            update('openHouse', createEmptyOpenHouse());
          }

          // Cocher ou décocher repart toujours de zéro ; les unités démarrent à 1
          const toggled = (m: Material) => current.includes(m) !== materials.includes(m);
          const isOn = (m: Material) => materials.includes(m);
          if (toggled('keybox')) update('keybox', { code: '', placement: '' });
          if (toggled('flags')) update('flags', { mention: null, customMention: '', quantity: 1 });
          if (toggled('directional')) {
            update('directionals', { mention: null, units: isOn('directional') ? [createPlacedUnit()] : [] });
          }
          if (toggled('other')) update('otherNeeds', '');

          props.field.onChange(materials);
        };

        return (
          <>
            <CheckboxGroup
              {...bindField(props)}
              onChange={handleChange}
              legend="Qu'avez-vous besoin d'installer ?"
              options={options}
              required
            />
            {hasFrames && (
              <Notice variant="warning">
                Les installations de pancartes incluent l&apos;installation du kit (ancrage et poteau).
              </Notice>
            )}
          </>
        );
      }}
    />
  );
}