'use client';

import { useId, useState, type Ref } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { STORAGE_PICKUP_MATERIALS } from '@/features/services/constants/largeFormat';
import {
  createEmptyLargeStoragePickupForm, largeStoragePickupSchema, toLargeStoragePickupFormValues,
  type LargeStoragePickupFormValues,
} from '@/features/services/schemas/largeFormat.schema';
import type { LargeStoragePickupDetails } from '@/features/services/types/largeFormat';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
import { toOptions } from '@/features/services/components/fields/types';
import { useServiceFormHandle, type ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';
import formStyles from '../installationForm/installationForm.module.css';

interface LargeStoragePickupFormProps {
  handle: Ref<ServiceFormHandle<LargeStoragePickupDetails>>;
  initialValues?: LargeStoragePickupDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: LargeStoragePickupFormValues;
  onAutoSave: AutoSaveHandler<LargeStoragePickupFormValues, LargeStoragePickupDetails>;
}

export function LargeStoragePickupForm({ handle, initialValues, draft, onAutoSave }: LargeStoragePickupFormProps) {
  const headingId = useId();
  const t = useTranslations('services.largeFormat');
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toLargeStoragePickupFormValues(initialValues) : createEmptyLargeStoragePickupForm()),
  );

  const { control, handleSubmit, watch, getValues } = useForm<LargeStoragePickupFormValues, unknown, LargeStoragePickupDetails>({
    resolver: zodResolver(largeStoragePickupSchema),
    defaultValues,
    shouldFocusError: true,
  });
  useAutoSave(watch, getValues, largeStoragePickupSchema, onAutoSave);
  useServiceFormHandle(handle, handleSubmit);

  return (
    <form noValidate className={formStyles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={formStyles.section}>
        <h3 id={headingId} className={formStyles.sectionTitle}>
          {t('storageTitle')}
        </h3>
        <Controller
          control={control}
          name="materials"
          render={({ field, fieldState }) => (
            <CheckboxGroup
              legend={t('storageLegend')}
              options={toOptions(STORAGE_PICKUP_MATERIALS, (m) => t(`storageMaterials.${m}`))}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              columns={2}
              error={fieldState.error?.message}
              required
            />
          )}
        />
      </section>
    </form>
  );
}
