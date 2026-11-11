'use client';

import { useId, type ReactNode } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  FLAG_MENTIONS, KEYBOX_CODE_MAX_DIGITS, SIGN_MENTIONS, TEXT_LIMITS,
} from '@/features/services/constants/installation';
import {
  MAX_REMOVAL_DIRECTIONALS, MAX_REMOVAL_FLAGS, MAX_REMOVAL_KEYBOXES, REMOVAL_TEXT_LIMITS,
} from '@/features/services/constants/removal';
import { createRemovalDirectional } from '@/features/services/schemas/removal.schema';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from './formContext';
import styles from '../installationForm/installationForm.module.css';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

/* ---------- Boîtes à clés ---------- */

export function RemovalKeyboxSection() {
  const { control } = useRemovalFormContext();
  const t = useTranslations('services');

  return (
    <Section title={t('removal.keyboxTitle')}>
      <Controller
        control={control}
        name="keybox.quantity"
        render={({ field, fieldState }) => (
          <QuantityField
            label={t('removal.keyboxQuantity')}
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_REMOVAL_KEYBOXES}
            hint={t('common.max', { max: MAX_REMOVAL_KEYBOXES })}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="keybox.code"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            // Chiffres seulement, longueur maximale imposée à la saisie
            onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
            label={t('removal.keyboxCode')}
            placeholder={t('installation.codePlaceholder')}
            inputMode="numeric"
            hint={t('installation.codeHint', { max: KEYBOX_CODE_MAX_DIGITS })}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="keybox.placement"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label={t('installation.keyboxPlacement')}
            maxLength={REMOVAL_TEXT_LIMITS.keyboxPlacement}
            multiline
            rows={2}
          />
        )}
      />
    </Section>
  );
}

/* ---------- Drapeaux ---------- */

export function RemovalFlagsSection() {
  const { control, setValue, formState } = useRemovalFormContext();
  const t = useTranslations('services');

  return (
    <Section title={t('removal.flagsTitle')}>
      {/* Mêmes mentions qu'à l'installation */}
      <Controller
        control={control}
        name="flags.mention"
        render={(props) => (
          <>
            <RadioGroup
              {...bindRemovalField(props)}
              onChange={(value) => {
                props.field.onChange(value);
                if (value !== 'other') {
                  setValue('flags.customMention', '', { shouldDirty: true, shouldValidate: formState.isSubmitted });
                }
              }}
              legend={t('installation.flagMentionLegend')}
              options={toOptions(FLAG_MENTIONS, (m) => t(`mentions.${m}`))}
              required
            />
            {props.field.value === 'other' && (
              <Controller
                control={control}
                name="flags.customMention"
                render={(p) => (
                  <TextField
                    {...bindRemovalField(p)}
                    label={t('installation.flagCustomMention')}
                    maxLength={TEXT_LIMITS.flagMention}
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
            label={t('removal.flagsQuantity')}
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_REMOVAL_FLAGS}
            hint={t('common.max', { max: MAX_REMOVAL_FLAGS })}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="flags.placement"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label={t('removal.flagsPlacement')}
            maxLength={REMOVAL_TEXT_LIMITS.flagsPlacement}
            multiline
            rows={2}
          />
        )}
      />
    </Section>
  );
}

/* ---------- Directionnelles ---------- */

export function RemovalDirectionalsSection() {
  const { control } = useRemovalFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'directionals.units' });
  const t = useTranslations('services');

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createRemovalDirectional), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <Section title={t('removal.directionalsTitle')}>
      <Controller
        control={control}
        name="directionals.mention"
        render={(props) => (
          <RadioGroup
            {...bindRemovalField(props)}
            legend={t('installation.directionalMentionLegend')}
            options={toOptions(SIGN_MENTIONS, (m) => t(`mentions.${m}`))}
            required
          />
        )}
      />
      <QuantityField
        label={t('removal.directionalsQuantity')}
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_REMOVAL_DIRECTIONALS}
        hint={t('common.max', { max: MAX_REMOVAL_DIRECTIONALS })}
      />
      {fields.map((field, index) => (
        <Controller
          key={field.id}
          control={control}
          name={`directionals.units.${index}.placement`}
          render={(props) => (
            <TextField
              {...bindRemovalField(props)}
              label={t('installation.directionalPlacement', { number: index + 1 })}
              placeholder={t('installation.placementExample')}
              maxLength={REMOVAL_TEXT_LIMITS.directionalPlacement}
              multiline
              rows={2}
            />
          )}
        />
      ))}
    </Section>
  );
}

/* ---------- Autres ---------- */

export function RemovalOtherSection() {
  const { control } = useRemovalFormContext();
  const t = useTranslations('services.removal');

  return (
    <Section title={t('otherTitle')}>
      <Controller
        control={control}
        name="otherDetails"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label={t('otherDetails')}
            maxLength={REMOVAL_TEXT_LIMITS.otherDetails}
            multiline
            rows={3}
            required
          />
        )}
      />
    </Section>
  );
}