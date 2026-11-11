'use client';

import { useId, useImperativeHandle, useState, type Ref } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CORRECTION_KINDS, CORRECTION_TEXT_LIMITS } from '@/features/services/constants/correction';
import {
  correctionSchema, createEmptyCorrectionForm, toCorrectionFormValues, type CorrectionFormValues,
} from '@/features/services/schemas/correction.schema';
import type { CorrectionDetails } from '@/features/services/types/correction';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { TextField } from '@/features/services/components/fields/TextField';
import { toOptions } from '@/features/services/components/fields/types';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';
import styles from '../installationForm/installationForm.module.css';

interface CorrectionFormProps {
  handle: Ref<ServiceFormHandle<CorrectionDetails>>;
  initialValues?: CorrectionDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: CorrectionFormValues;
  onAutoSave: AutoSaveHandler<CorrectionFormValues, CorrectionDetails>;
}

export function CorrectionForm({ handle, initialValues, draft, onAutoSave }: CorrectionFormProps) {
  const headingId = useId();
  const t = useTranslations('services.correction');
  // Calculé une seule fois : useForm ne lit defaultValues qu'au montage
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toCorrectionFormValues(initialValues) : createEmptyCorrectionForm()),
  );

  const { control, handleSubmit, setValue, formState, watch, getValues } = useForm<CorrectionFormValues, unknown, CorrectionDetails>({
    resolver: zodResolver(correctionSchema),
    defaultValues,
    shouldFocusError: true,
  });
  useAutoSave(watch, getValues, correctionSchema, onAutoSave);

  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<CorrectionDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <form noValidate className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={styles.section}>
        <h3 id={headingId} className={styles.sectionTitle}>{t('title')}</h3>

        <Controller
          control={control}
          name="kind"
          render={({ field, fieldState }) => (
            <>
              <RadioGroup
                legend={t('kindLegend')}
                options={toOptions(CORRECTION_KINDS, (k) => t(`kinds.${k}`))}
                value={field.value}
                onChange={(kind) => {
                  field.onChange(kind);
                  // Redressage : l'explication n'a plus lieu d'être
                  if (kind !== 'explain') {
                    setValue('explanation', '', { shouldValidate: formState.isSubmitted });
                  }
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                columns={2}
                error={fieldState.error?.message}
                required
              />

              {field.value === 'explain' && (
                <Controller
                  control={control}
                  name="explanation"
                  render={({ field: f, fieldState: fs }) => (
                    <TextField
                      label={t('explanation')}
                      value={f.value}
                      onChange={f.onChange}
                      onBlur={f.onBlur}
                      inputRef={f.ref}
                      maxLength={CORRECTION_TEXT_LIMITS.explanation}
                      multiline
                      rows={4}
                      error={fs.error?.message}
                      required
                    />
                  )}
                />
              )}
            </>
          )}
        />
      </section>
    </form>
  );
}