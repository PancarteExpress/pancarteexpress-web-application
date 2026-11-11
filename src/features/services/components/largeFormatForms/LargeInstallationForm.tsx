'use client';

import { useId, useState, type Ref } from 'react';
import { Controller, useForm, useWatch, type FieldPath, type PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  ACQUISITIONS, EASEL_STYLES, LARGE_TEXT_LIMITS, STRUCTURES, WOOD_FRAMD_STYLES, type Structure,
} from '@/features/services/constants/largeFormat';
import {
  createEmptyLargeInstallationForm, largeInstallationSchema, toLargeInstallationFormValues,
  type LargeInstallationFormValues,
} from '@/features/services/schemas/largeFormat.schema';
import type { LargeInstallationDetails } from '@/features/services/types/largeFormat';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { TextField } from '@/features/services/components/fields/TextField';
import { YesNoField } from '@/features/services/components/fields/YesNoField';
import { toOptions } from '@/features/services/components/fields/types';
import { useServiceFormHandle, type ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';
import { LargePlacementPicker } from './LargePlacementPicker';
import formStyles from '../installationForm/installationForm.module.css';
import styles from './largeFormatForms.module.css';

type Values = LargeInstallationFormValues;

interface LargeInstallationFormProps {
  handle: Ref<ServiceFormHandle<LargeInstallationDetails>>;
  initialValues?: LargeInstallationDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: LargeInstallationFormValues;
  onAutoSave: AutoSaveHandler<LargeInstallationFormValues, LargeInstallationDetails>;
}

export function LargeInstallationForm({ handle, initialValues, draft, onAutoSave }: LargeInstallationFormProps) {
  const headingId = useId();
  const t = useTranslations('services.largeFormat');
  const acquisitionOptions = toOptions(ACQUISITIONS, (a) => t(`acquisitions.${a}`));
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toLargeInstallationFormValues(initialValues) : createEmptyLargeInstallationForm()),
  );

  const { control, handleSubmit, setValue, formState, watch, getValues } = useForm<Values, unknown, LargeInstallationDetails>({
    resolver: zodResolver(largeInstallationSchema),
    defaultValues,
    shouldFocusError: true,
  });
  useAutoSave(watch, getValues, largeInstallationSchema, onAutoSave);
  useServiceFormHandle(handle, handleSubmit);

  const location = useWatch({ control, name: 'location' });
  const access = useWatch({ control, name: 'access' });
  const structures = useWatch({ control, name: 'structures' });
  const woodFramdPaint = useWatch({ control, name: 'woodFramdPaint' });
  const easelPaint = useWatch({ control, name: 'easelPaint' });

  const set = <TName extends FieldPath<Values>>(name: TName, value: PathValue<Values, TName>) =>
    setValue(name, value, { shouldDirty: true, shouldValidate: formState.isSubmitted });

  /** Réponses propres à une structure, remises à zéro quand elle est décochée */
  const resetStructure = (s: Structure) => {
    switch (s) {
      case 'aluminumFramd':
        set('aluminumAcquisition', null);
        break;
      case 'signageFramd':
        set('signageAcquisition', null);
        break;
      case 'woodFramd':
        set('woodFramdStyle', null);
        set('woodFramdPaint', null);
        set('woodFramdColor', '');
        break;
      case 'woodEasel':
        set('easelStyle', null);
        set('easelPaint', null);
        set('easelColor', '');
        break;
    }
  };

  const handleLocationChange = (next: 'ground' | 'wall') => {
    set('location', next);
    set('access', null);
    // Au mur : aucune structure ; on efface les réponses du sol
    if (next === 'wall') {
      structures.forEach(resetStructure);
      set('structures', []);
    }
  };

  const handleStructuresChange = (next: Structure[]) => {
    structures.filter((s) => !next.includes(s)).forEach(resetStructure);
    set('structures', next);
  };

  return (
    <form noValidate className={formStyles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={formStyles.section}>
        <h3 id={headingId} className={formStyles.sectionTitle}>{t('installationTitle')}</h3>

        <Controller
          control={control}
          name="dimensions"
          render={({ field, fieldState }) => (
            <TextField
              label={t('dimensions')}
              placeholder={t('dimensionsPlaceholder')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              maxLength={LARGE_TEXT_LIMITS.dimensions}
              multiline
              rows={2}
              error={fieldState.error?.message}
              required
            />
          )}
        />

        <LargePlacementPicker
          legend={t('placementLegend')}
          location={location}
          access={access}
          onLocationChange={handleLocationChange}
          onAccessChange={(next) => set('access', next)}
          errors={{ location: formState.errors.location?.message, access: formState.errors.access?.message }}
        />

        {location === 'ground' && (
          <div className={styles.subOptions}>
            <CheckboxGroup
              legend={t('structuresLegend')}
              options={toOptions(STRUCTURES, (s) => t(`structures.${s}`))}
              value={structures}
              onChange={handleStructuresChange}
              columns={2}
              error={formState.errors.structures?.message}
              required
            />

            {structures.includes('aluminumFramd') && (
              <Controller
                control={control}
                name="aluminumAcquisition"
                render={({ field, fieldState }) => (
                  <RadioGroup
                    legend={t('rentAluminum')}
                    options={acquisitionOptions}
                    value={field.value}
                    onChange={field.onChange}
                    columns={2}
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />
            )}

            {structures.includes('signageFramd') && (
              <Controller
                control={control}
                name="signageAcquisition"
                render={({ field, fieldState }) => (
                  <RadioGroup
                    legend={t('rentSignage')}
                    options={acquisitionOptions}
                    value={field.value}
                    onChange={field.onChange}
                    columns={2}
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />
            )}

            {structures.includes('woodFramd') && (
              <>
                <Controller
                  control={control}
                  name="woodFramdStyle"
                  render={({ field, fieldState }) => (
                    <RadioGroup
                      legend={t('woodFramdStyle')}
                      options={toOptions(WOOD_FRAMD_STYLES, (s) => t(`styles.${s}`))}
                      value={field.value}
                      onChange={field.onChange}
                      columns={2}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="woodFramdPaint"
                  render={({ field, fieldState }) => (
                    <YesNoField
                      legend={t('woodFramdPaint')}
                      value={field.value}
                      onChange={(paint) => {
                        field.onChange(paint);
                        if (!paint) set('woodFramdColor', '');
                      }}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />
                {woodFramdPaint === true && (
                  <Controller
                    control={control}
                    name="woodFramdColor"
                    render={({ field, fieldState }) => (
                      <TextField
                        label={t('woodFramdColor')}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        maxLength={LARGE_TEXT_LIMITS.paintColor}
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                )}
              </>
            )}

            {structures.includes('woodEasel') && (
              <>
                <Controller
                  control={control}
                  name="easelStyle"
                  render={({ field, fieldState }) => (
                    <RadioGroup
                      legend={t('easelStyle')}
                      options={toOptions(EASEL_STYLES, (s) => t(`styles.${s}`))}
                      value={field.value}
                      onChange={field.onChange}
                      columns={2}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="easelPaint"
                  render={({ field, fieldState }) => (
                    <YesNoField
                      legend={t('easelPaint')}
                      value={field.value}
                      onChange={(paint) => {
                        field.onChange(paint);
                        if (!paint) set('easelColor', '');
                      }}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />
                {easelPaint === true && (
                  <Controller
                    control={control}
                    name="easelColor"
                    render={({ field, fieldState }) => (
                      <TextField
                        label={t('easelColor')}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        maxLength={LARGE_TEXT_LIMITS.paintColor}
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                )}
              </>
            )}
          </div>
        )}
      </section>
    </form>
  );
}
