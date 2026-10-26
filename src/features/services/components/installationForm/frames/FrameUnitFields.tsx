'use client';

import { Controller } from 'react-hook-form';
import { FRAME_MODEL_LABELS, FRAME_MODELS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { RadioGroup, TextField, YesNoField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext, type FrameUnitPath } from '../formContext';
import styles from '../installationForm.module.css';

const MODEL_OPTIONS = toOptions(FRAME_MODELS, FRAME_MODEL_LABELS);

interface FrameUnitFieldsProps {
  index: number;
  isMember: boolean;
  accountName: string | null;
}

export function FrameUnitFields({ index, isMember, accountName }: FrameUnitFieldsProps) {
  const base: FrameUnitPath = `frames.units.${index}`;
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();

  return (
    <fieldset className={styles.unit}>
        <legend className={styles.unitTitle}>Détails de la pancarte #{index + 1}</legend>

        {isMember && (
        <Controller
            control={control}
            name={`${base}.model`}
            render={(props) => (
            <>
                <RadioGroup
                {...bindField(props)}
                onChange={(value) => {
                    props.field.onChange(value);
                    if (value !== 'custom') update(`${base}.modelDescription`, '');
                }}
                legend="Quel modèle de pancarte voulez-vous ?"
                options={MODEL_OPTIONS}
                required
                />
                {props.field.value === 'custom' && (
                <Controller
                    control={control}
                    name={`${base}.modelDescription`}
                    render={(p) => (
                    <TextField
                        {...bindField(p)}
                        label="Veuillez décrire le modèle"
                        maxLength={TEXT_LIMITS.modelDescription}
                        multiline
                        required
                    />
                    )}
                />
                )}
            </>
            )}
        />)}

      {accountName && (
        <Controller
          control={control}
          name={`${base}.useAccountName`}
          render={(props) => (
            <>
              <YesNoField
                {...bindField(props)}
                onChange={(value) => {
                  props.field.onChange(value);
                  if (value) update(`${base}.displayName`, '');
                }}
                legend={`Est-ce que le nom à afficher est « ${accountName} » ?`}
                required
              />
              {props.field.value === false && (
                <Controller
                  control={control}
                  name={`${base}.displayName`}
                  render={(p) => (
                    <TextField
                      {...bindField(p)}
                      label="Nom(s) à afficher"
                      placeholder="Ex. : indiquer le(s) nom(s) à afficher"
                      maxLength={TEXT_LIMITS.displayName}
                      required
                    />
                  )}
                />
              )}
            </>
          )}
        />
      )}
    </fieldset>
  );
}