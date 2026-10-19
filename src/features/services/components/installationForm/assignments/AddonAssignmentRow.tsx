'use client';

import { useFormState, useWatch } from 'react-hook-form';
import { ADDON_LABELS } from '@/features/services/constants/installation';
import { useFormUpdater, useInstallationFormContext } from '../formContext';
import { TargetsPicker } from './TargetsPicker';
import styles from '../installationForm.module.css';

interface AddonAssignmentRowProps {
  index: number;
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

  return (
    <fieldset className={styles.assignment}>
      <legend className={styles.unitTitle}>{label}</legend>
      <TargetsPicker
        label={label}
        value={entry}
        // Une seule mise à jour de l'entrée : quantité et cibles restent cohérentes
        onChange={(targets) => update(path, { ...entry, ...targets })}
        frameUids={frameUids}
        quantityError={entryErrors?.quantity?.message}
        targetsError={entryErrors?.frameUids?.message ?? entryErrors?.onSite?.message}
      />
    </fieldset>
  );
}