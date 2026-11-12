'use client';

import { Controller, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ADDONS_WITH_MODEL, FRAME_MODELS, TEXT_LIMITS, type Addon } from '@/features/services/constants/installation';
import { RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../../formContext';
import { TargetsPicker } from './TargetsPicker';
import { MultiplePlacementFields } from '../../placementFieldsTEst/multiplePlacementFields';
import styles from '../../installationForm.module.css';

// Clés i18n du namespace services.installation
const MENTION_FIELDS: Partial<Record<Addon, { labelKey: 'otherMention' | 'customNoMentionDetails'; required: boolean }>> = {
  other: { labelKey: 'otherMention', required: true },
  customNoMention: { labelKey: 'customNoMentionDetails', required: false },
};
const WITH_MODEL: readonly Addon[] = ADDONS_WITH_MODEL;

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
  const t = useTranslations('services');
  const label = t(`addons.${entry.addon}`);
  const mentionField = MENTION_FIELDS[entry.addon];

  return (
    <fieldset className={styles.assignment}>
      <legend className={styles.unitTitle}>{label}</legend>

      {WITH_MODEL.includes(entry.addon) && (
        <Controller
          control={control}
          name={`${path}.model`}
          render={(props) => (
            <>
              <RadioGroup
                {...bindField(props)}
                onChange={(value) => {
                  props.field.onChange(value);
                  if (value !== 'custom') update(`${path}.modelDescription`, '');
                }}
                legend={t('installation.modelLegend')}
                options={toOptions(FRAME_MODELS, (m) => t(`frameModels.${m}`))}
                required
              />
              {props.field.value === 'custom' && (
                <Controller
                  control={control}
                  name={`${path}.modelDescription`}
                  render={(p) => (
                    <TextField
                      {...bindField(p)}
                      label={t('installation.describeModel')}
                      maxLength={TEXT_LIMITS.modelDescription}
                      multiline
                      rows={2}
                      required
                    />
                  )}
                />
              )}
            </>
          )}
        />
      )}

      {mentionField && (
        <Controller
          control={control}
          name={`${path}.mention`}
          render={(props) => (
            <TextField
              {...bindField(props)}
              label={t(`installation.${mentionField.labelKey}`)}
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
        // Une seule mise à jour de l'entrée : quantité, cibles et emplacements restent cohérents
        onChange={(targets) =>
          update(path, { ...entry, ...targets, placements: entry.placements.slice(0, targets.quantity) })
        }
        frameUids={frameUids}
        quantityError={entryErrors?.quantity?.message}
        targetsError={entryErrors?.frameUids?.message ?? entryErrors?.onSite?.message}
      />

      {/* Sans pancarte commandée, l'ajout a ses propres emplacements */}
      {frameUids.length === 0 && (
        <MultiplePlacementFields name={`${path}.placements`} quantity={entry.quantity} label={label} />
      )}
    </fieldset>
  );
}