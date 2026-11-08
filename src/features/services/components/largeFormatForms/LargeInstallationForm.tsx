'use client';

import { useId, useState, type Ref } from 'react';
import { Controller, useForm, useWatch, type FieldPath, type PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ACQUISITION_LABELS, ACQUISITIONS, EASEL_STYLES, LARGE_TEXT_LIMITS, STRUCTURE_LABELS, STRUCTURE_STYLE_LABELS,
  STRUCTURES, WOOD_FRAMD_STYLES, type Structure,
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
import { LargePlacementPicker } from './LargePlacementPicker';
import formStyles from '../installationForm/installationForm.module.css';
import styles from './largeFormatForms.module.css';

type Values = LargeInstallationFormValues;

const STRUCTURE_OPTIONS = toOptions(STRUCTURES, STRUCTURE_LABELS);
const ACQUISITION_OPTIONS = toOptions(ACQUISITIONS, ACQUISITION_LABELS);
const WOOD_FRAMD_STYLE_OPTIONS = toOptions(WOOD_FRAMD_STYLES, STRUCTURE_STYLE_LABELS);
const EASEL_STYLE_OPTIONS = toOptions(EASEL_STYLES, STRUCTURE_STYLE_LABELS);

interface LargeInstallationFormProps {
  handle: Ref<ServiceFormHandle<LargeInstallationDetails>>;
  initialValues?: LargeInstallationDetails;
}

export function LargeInstallationForm({ handle, initialValues }: LargeInstallationFormProps) {
  const headingId = useId();
  const [defaultValues] = useState(() =>
    initialValues ? toLargeInstallationFormValues(initialValues) : createEmptyLargeInstallationForm(),
  );

  const { control, handleSubmit, setValue, formState } = useForm<Values, unknown, LargeInstallationDetails>({
    resolver: zodResolver(largeInstallationSchema),
    defaultValues,
    shouldFocusError: true,
  });
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
        <h3 id={headingId} className={formStyles.sectionTitle}>Détails de l&apos;installation</h3>

        <Controller
          control={control}
          name="dimensions"
          render={({ field, fieldState }) => (
            <TextField
              label="Dimensions de la ou des pancartes"
              placeholder="Veuillez indiquer les dimensions voulues…"
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
          legend="Veuillez indiquer l'emplacement de l'installation"
          location={location}
          access={access}
          onLocationChange={handleLocationChange}
          onAccessChange={(next) => set('access', next)}
          errors={{ location: formState.errors.location?.message, access: formState.errors.access?.message }}
        />

        {location === 'ground' && (
          <div className={styles.subOptions}>
            <CheckboxGroup
              legend="Veuillez indiquer le type de structure dont vous avez besoin"
              options={STRUCTURE_OPTIONS}
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
                    legend="Souhaitez-vous louer la structure en aluminium FRAMD ?"
                    options={ACQUISITION_OPTIONS}
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
                    legend="Souhaitez-vous louer la structure signalétique FRAMD ?"
                    options={ACQUISITION_OPTIONS}
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
                      legend="Quel style de structure en bois FRAMD souhaitez-vous ?"
                      options={WOOD_FRAMD_STYLE_OPTIONS}
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
                      legend="Souhaitez-vous peindre la structure en bois FRAMD ?"
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
                        label="De quelle couleur ? (structure en bois FRAMD)"
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
                      legend="Quel style de structure en bois « Chevalet » souhaitez-vous ?"
                      options={EASEL_STYLE_OPTIONS}
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
                      legend="Souhaitez-vous peindre la structure en bois « Chevalet » ?"
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
                        label="De quelle couleur ? (structure en bois « Chevalet »)"
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
