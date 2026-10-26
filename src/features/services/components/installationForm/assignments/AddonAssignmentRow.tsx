'use client';

import { Controller, useFormState, useWatch } from 'react-hook-form';
import { ADDON_LABELS, TEXT_LIMITS, type Addon } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import { TargetsPicker } from './TargetsPicker';
import styles from '../installationForm.module.css';

const MENTION_FIELDS: Partial<Record<Addon, { label: string; required: boolean }>> = {
  other: { label: 'Veuillez indiquer la mention qui doit être affichée', required: true },
  customNoMention: { label: 'Précisions sur votre ajout personnalisé (facultatif)', required: false },
};

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
  const mentionField = MENTION_FIELDS[entry.addon];

  return (
    <fieldset className={styles.assignment}>
      <legend className={styles.unitTitle}>{label}</legend>

      {mentionField && (
        <Controller
          control={control}
          name={`${path}.mention`}
          render={(props) => (
            <TextField
              {...bindField(props)}
              label={mentionField.label}
              maxLength={TEXT_LIMITS.addonMention}
              multiline
              rows={2}
              required={mentionField.required}
            />
          )}
        />
      )}

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