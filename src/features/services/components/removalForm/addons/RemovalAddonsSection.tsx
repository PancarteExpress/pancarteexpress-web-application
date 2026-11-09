'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_REMOVAL_ADDONS, REMOVAL_TEXT_LIMITS } from '@/features/services/constants/removal';
import { TextField } from '@/features/services/components/fields';
import { useRemovalFormContext } from '../formContext';
import { RemovalUnitsFields } from '../RemovalUnitsFields';
import styles from '../../installationForm/installationForm.module.css';

export function RemovalAddonsSection() {
  const headingId = useId();
  const { control } = useRemovalFormContext();
  const t = useTranslations('services.removal');

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{t('addonsTitle')}</h3>

      <RemovalUnitsFields
        name="addons.units"
        quantityLabel={t('addonsQuantity')}
        unitName={t('addonUnit')}
        max={MAX_REMOVAL_ADDONS}
      />

      <Controller
        control={control}
        name="addons.details"
        render={({ field, fieldState }) => (
          <TextField
            label={t('addonsDetails')}
            placeholder={t('addonsDetailsPlaceholder')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            maxLength={REMOVAL_TEXT_LIMITS.addonsDetails}
            multiline
            rows={2}
            error={fieldState.error?.message}
          />
        )}
      />
    </section>
  );
}