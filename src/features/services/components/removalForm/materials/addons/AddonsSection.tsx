'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_REMOVAL_ADDONS, REMOVAL_TEXT_LIMITS } from '@/features/services/constants/removal';
import { TextField } from '@/features/services/components/fields';
import { useRemovalFormContext } from '../../formContext';
import { UnitPlacementField } from '../../placementFields/unitPlacementFields';
import styles from '../../../installationForm/installationForm.module.css';

import { SiOneplus } from "react-icons/si";

export function AddonsSection() {
  const headingId = useId();
  const { control } = useRemovalFormContext();
  const t = useTranslations('services.removal');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><SiOneplus  size={34} /> {t('addonsTitle')}</h3>

      <UnitPlacementField
        name="addons.units"
        quantityLabel={t('addonsQuantity')}
        unitName={t('addonUnit')}
        max={MAX_REMOVAL_ADDONS}
      />

      <Controller
        control={control}
        name="addons.details"
        render={({ field, fieldState }) => (
          <fieldset className={styles.unit}>
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
          </fieldset>
        )}
      />
    </section>
  );
}