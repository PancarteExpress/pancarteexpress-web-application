'use client';

import { useId, useImperativeHandle, useState, type Ref } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PICKUP_MATERIAL_LABELS, PICKUP_MATERIALS, PICKUP_TEXT_LIMITS } from '@/features/services/constants/pickup';
import {
  createEmptyPickupForm, isPickupDetailsRequired, pickupSchema, toPickupFormValues, type PickupFormValues,
} from '@/features/services/schemas/pickup.schema';
import type { PickupDetails } from '@/features/services/types/pickup';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
import { TextField } from '@/features/services/components/fields/TextField';
import { YesNoField } from '@/features/services/components/fields/YesNoField';
import { toOptions } from '@/features/services/components/fields/types';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import styles from '../installationForm/installationForm.module.css';

const MATERIAL_OPTIONS = toOptions(PICKUP_MATERIALS, PICKUP_MATERIAL_LABELS);

interface PickupFormProps {
  handle: Ref<ServiceFormHandle<PickupDetails>>;
  initialValues?: PickupDetails;
}

export function PickupForm({ handle, initialValues }: PickupFormProps) {
  const headingId = useId();
  const [defaultValues] = useState(() =>
    initialValues ? toPickupFormValues(initialValues) : createEmptyPickupForm(),
  );

  const { control, handleSubmit } = useForm<PickupFormValues, unknown, PickupDetails>({
    resolver: zodResolver(pickupSchema),
    defaultValues,
    shouldFocusError: true,
  });

  const materials = useWatch({ control, name: 'materials' });
  const newModels = useWatch({ control, name: 'newModels' });
  const detailsRequired = isPickupDetailsRequired({ materials, newModels });

  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<PickupDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <form noValidate className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={styles.section}>
        <h3 id={headingId} className={styles.sectionTitle}>Détails du ramassage</h3>

        <Controller
          control={control}
          name="materials"
          render={({ field, fieldState }) => (
            <CheckboxGroup
              legend="Que voulez-vous qu'on ramasse ?"
              options={MATERIAL_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="newModels"
          render={({ field, fieldState }) => (
            <YesNoField
              legend="Y a-t-il de nouveaux modèles pour ce ramassage (ex. : changement d'informations, d'agence, etc.) ?"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="details"
          render={({ field, fieldState }) => (
            <TextField
              label="Détails supplémentaires"
              placeholder="Veuillez décrire le matériel à ramasser…"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              maxLength={PICKUP_TEXT_LIMITS.details}
              multiline
              rows={4}
              error={fieldState.error?.message}
              required={detailsRequired}
            />
          )}
        />
      </section>
    </form>
  );
}