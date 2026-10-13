'use client';

import { useFormState, useWatch } from 'react-hook-form';
import { ADDON_LABELS } from '@/features/services/constants/installation';
import { CheckboxGroup, QuantityField, type ChoiceOption, type Columns } from '@/features/services/components/fields';
import { useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

const ON_SITE = 'onSite';

interface AddonAssignmentRowProps {
  index: number;
  /** uid des pancartes de la demande, dans l'ordre (vide si Pancartes non coché) */
  frameUids: string[];
}

export function AddonAssignmentRow({ index, frameUids }: AddonAssignmentRowProps) {
  const path = `addons.${index}` as const;
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const entry = useWatch({ control, name: path });
  const { errors } = useFormState({ control, name: path });
  const entryErrors = errors.addons?.[index];

  const label = ADDON_LABELS[entry.addon];
  const assigned = entry.frameUids.length;
  // « Sur place » réserve au moins une unité
  const frameSlots = entry.quantity - (entry.onSite ? 1 : 0);

  const options: ChoiceOption<string>[] = [
    ...frameUids.map((uid, i) => ({
      value: uid,
      label: `Pancarte ${i + 1}`,
      disabled: !entry.frameUids.includes(uid) && assigned >= frameSlots,
    })),
    {
      value: ON_SITE,
      label: 'Pancarte sur place',
      disabled: !entry.onSite && assigned >= entry.quantity,
    },
  ];

  const columns: Columns = frameUids.length >= 3 ? 4 : frameUids.length === 2 ? 3 : frameUids.length === 1 ? 2 : 1;

  // Une seule mise à jour de l'entrée : quantité et cibles restent cohérentes
  const handleQuantity = (quantity: number) => {
    update(path, {
      ...entry,
      quantity,
      frameUids: entry.frameUids.slice(0, entry.onSite ? quantity - 1 : quantity),
    });
  };

  const handleTargets = (next: string[]) => {
    update(path, {
      ...entry,
      frameUids: next.filter((v) => v !== ON_SITE),
      onSite: next.includes(ON_SITE),
    });
  };

  return (
    <fieldset className={styles.assignment}>
      <legend className={styles.unitTitle}>{label}</legend>

      <QuantityField
        label="Quantité"
        value={entry.quantity}
        onChange={handleQuantity}
        min={1}
        error={entryErrors?.quantity?.message}
      />

      <CheckboxGroup
        legend={`Pancartes qui recevront « ${label} »`}
        hideLegend
        options={options}
        value={entry.onSite ? [...entry.frameUids, ON_SITE] : entry.frameUids}
        onChange={handleTargets}
        columns={columns}
        error={entryErrors?.frameUids?.message ?? entryErrors?.onSite?.message}
      />
    </fieldset>
  );
}