'use client';

import { useId, useState, type Ref } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEmptyLargeRetrievalForm, largeRetrievalSchema, toLargeRetrievalFormValues, type LargeRetrievalFormValues,
} from '@/features/services/schemas/largeFormat.schema';
import type { LargeRetrievalDetails } from '@/features/services/types/largeFormat';
import { useServiceFormHandle, type ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { LargePlacementPicker } from './LargePlacementPicker';
import formStyles from '../installationForm/installationForm.module.css';

interface LargeRetrievalFormProps {
  handle: Ref<ServiceFormHandle<LargeRetrievalDetails>>;
  initialValues?: LargeRetrievalDetails;
}

export function LargeRetrievalForm({ handle, initialValues }: LargeRetrievalFormProps) {
  const headingId = useId();
  const [defaultValues] = useState(() =>
    initialValues ? toLargeRetrievalFormValues(initialValues) : createEmptyLargeRetrievalForm(),
  );

  const { control, handleSubmit, setValue, formState } = useForm<LargeRetrievalFormValues, unknown, LargeRetrievalDetails>({
    resolver: zodResolver(largeRetrievalSchema),
    defaultValues,
    shouldFocusError: true,
  });
  useServiceFormHandle(handle, handleSubmit);

  const location = useWatch({ control, name: 'location' });
  const access = useWatch({ control, name: 'access' });
  const options = { shouldDirty: true, shouldValidate: formState.isSubmitted };

  return (
    <form noValidate className={formStyles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={formStyles.section}>
        <h3 id={headingId} className={formStyles.sectionTitle}>Détails de la récupération de pancarte/structure</h3>
        <LargePlacementPicker
          legend="Veuillez préciser l'endroit de la pancarte"
          location={location}
          access={access}
          onLocationChange={(next) => {
            setValue('location', next, options);
            setValue('access', null, options);
          }}
          onAccessChange={(next) => setValue('access', next, options)}
          errors={{ location: formState.errors.location?.message, access: formState.errors.access?.message }}
        />
      </section>
    </form>
  );
}
