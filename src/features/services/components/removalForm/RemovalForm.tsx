'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmptyRemovalForm, removalSchema, toRemovalFormValues, type RemovalFormValues, } from '@/features/services/schemas/removal.schema';
import { RemovalDirectionalsSection, RemovalFlagsSection, RemovalKeyboxSection, RemovalOtherSection, } from './RemovalSimpleSections';
import type { RemovalDetails } from '@/features/services/types/removal';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';

import styles from '../installationForm/installationForm.module.css';
import { RemovalMaterialsSelector } from './RemovalMaterialsSelector';
import { RemovalFramesSection } from './frames/RemovalFramesSection';
import { RemovalAddonsSection } from './addons/RemovalAddonsSection';

interface RemovalFormProps {
  handle: Ref<ServiceFormHandle<RemovalDetails>>;
  initialValues?: RemovalDetails;
}

export function RemovalForm({ handle, initialValues }: RemovalFormProps) {
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
  const { handleSubmit } = methods;

  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<RemovalDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <FormProvider {...methods}>
      <form noValidate className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <RemovalMaterialsSelector />
        {materials.includes('frames') && <RemovalFramesSection />}
        {materials.includes('addons') && <RemovalAddonsSection />}
        {materials.includes('keybox') && <RemovalKeyboxSection />}
        {materials.includes('flags') && <RemovalFlagsSection />}
        {materials.includes('directional') && <RemovalDirectionalsSection />}
        {materials.includes('other') && <RemovalOtherSection />}
      </form>
    </FormProvider>
  );
}