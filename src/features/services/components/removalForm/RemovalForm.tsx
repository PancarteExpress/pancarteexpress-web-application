'use client';

import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEmptyRemovalForm, removalSchema, toRemovalFormValues, type RemovalFormValues,
} from '@/features/services/schemas/removal.schema';
import type { RemovalDetails } from '@/features/services/types/removal';
import styles from '../installationForm/installationForm.module.css';
import { RemovalMaterialsSelector } from './RemovalMaterialsSelector';
import { RemovalFramesSection } from './frames/RemovalFramesSection';

interface RemovalFormProps {
  onSubmit: (details: RemovalDetails) => void;
  initialValues?: RemovalDetails;
}

export function RemovalForm({ onSubmit, initialValues }: RemovalFormProps) {
  // Calculé une seule fois : useForm ne lit defaultValues qu'au montage
  const [defaultValues] = useState(() =>
    initialValues ? toRemovalFormValues(initialValues) : createEmptyRemovalForm(),
  );

  const methods = useForm<RemovalFormValues, unknown, RemovalDetails>({
    resolver: zodResolver(removalSchema),
    defaultValues,
    shouldFocusError: true,
  });

  const materials = useWatch({ control: methods.control, name: 'materials' });

  return (
    <FormProvider {...methods}>
      <form noValidate className={styles.form} onSubmit={methods.handleSubmit(onSubmit)}>
        <RemovalMaterialsSelector />
        {materials.includes('frames') && <RemovalFramesSection />}
        <button type="submit" className={styles.submit}>Enregistrer le retrait</button>
      </form>
    </FormProvider>
  );
}