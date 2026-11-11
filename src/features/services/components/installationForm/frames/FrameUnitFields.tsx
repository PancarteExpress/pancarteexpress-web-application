'use client';

import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FRAME_MODELS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { RadioGroup, TextField, YesNoField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext, type FrameUnitPath } from '../formContext';
import { UnitPlacementField } from '../PlacementFields';
import styles from '../installationForm.module.css';

interface FrameUnitFieldsProps {
  index: number;
  isMember: boolean;
  accountName: string | null;
}

export function FrameUnitFields({ index, isMember, accountName }: FrameUnitFieldsProps) {
  const base: FrameUnitPath = `frames.units.${index}`;
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const t = useTranslations('services');

  return (
    <fieldset className={styles.unit}>
        <legend className={styles.unitTitle}>{t('installation.frameUnitTitle', { number: index + 1 })}</legend>

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
                legend={t('installation.frameModelLegend')}
                options={toOptions(FRAME_MODELS, (m) => t(`frameModels.${m}`))}
                required
                />
                {props.field.value === 'custom' && (
                <Controller
                    control={control}
                    name={`${base}.modelDescription`}
                    render={(p) => (
                    <TextField
                        {...bindField(p)}
                        label={t('installation.describeModel')}
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
                legend={t('installation.useAccountName', { name: accountName })}
                required
              />
              {props.field.value === false && (
                <Controller
                  control={control}
                  name={`${base}.displayName`}
                  render={(p) => (
                    <TextField
                      {...bindField(p)}
                      label={t('installation.displayName')}
                      placeholder={t('installation.displayNamePlaceholder')}
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

      {/* Emplacement propre à cette pancarte, en dernier */}
      <UnitPlacementField name={`${base}.placement`} />
    </fieldset>
  );
}