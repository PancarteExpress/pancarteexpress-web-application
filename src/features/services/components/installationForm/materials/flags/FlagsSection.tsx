'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FLAG_MENTIONS, MAX_FLAGS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';

import { FaFlag } from "react-icons/fa";

export function FlagsSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const t = useTranslations('services');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><FaFlag size={25} /> {t('installation.flagsTitle')}</h3>

      <Controller
        control={control}
        name="flags.mention"
        render={(props) => (
          <>
            <RadioGroup
              {...bindField(props)}
              onChange={(value) => {
                props.field.onChange(value);
                if (value !== 'other') update('flags.customMention', '');
              }}
              legend={t('installation.flagMentionLegend')}
              options={toOptions(FLAG_MENTIONS, (m) => t(`mentions.${m}`))}
              columns={3}
              required
            />
            {props.field.value === 'other' && (
              <Controller
                control={control}
                name="flags.customMention"
                render={(p) => (
                  <TextField
                    {...bindField(p)}
                    label={t('installation.flagCustomMention')}
                    maxLength={TEXT_LIMITS.flagMention}
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

      <Controller
        control={control}
        name="flags.quantity"
        render={({ field, fieldState }) => (
          <QuantityField
            label={t('installation.flagsQuantity')}
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_FLAGS}
            hint={t('common.max', { max: MAX_FLAGS })}
            error={fieldState.error?.message}
          />
        )}
      />

      {/* Emplacement facultatif, comme pour les directionnelles */}
      <Controller
        control={control}
        name="flags.placement"
        render={({ field, fieldState }) => (
          <fieldset className={styles.unit}>
            <TextField
              label={t('installation.flagsPlacement')}
              placeholder={t('installation.placementExample')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              maxLength={TEXT_LIMITS.flagPlacement}
              error={fieldState.error?.message}
            />
          </fieldset>
        )}
      />
    </section>
  );
}