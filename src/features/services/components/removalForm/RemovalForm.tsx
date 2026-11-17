'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { createEmptyRemovalForm, createRemovalSchema, toRemovalFormValues, type RemovalFormValues, } from '@/features/services/schemas/removal.schema';
import { AfterRemovalQuestion } from './AfterRemovalQuestion';

import type { RemovalDetails } from '@/features/services/types/removal';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';

import styles from '../installationForm/installationForm.module.css';
import { IoConstructSharp } from "react-icons/io5";

import { MaterialsSelector } from './materials/materialsSelector';
import { useTranslations } from 'next-intl';
import { FramesSection } from './materials/frames/FramesSection';
import { AddonsSection } from './materials/addons/AddonsSection';
import { KeyboxSection } from './materials/keybox/KeyboxSection';
import { FlagsSection } from './materials/flags/FlagsSection';
import { DirectionalsSection } from './materials/directionals/DirectionalsSection';
import { OtherSection } from './materials/other/OtherSection';


interface RemovalFormProps {
  handle: Ref<ServiceFormHandle<RemovalDetails>>;
  initialValues?: RemovalDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: RemovalFormValues;
  onAutoSave: AutoSaveHandler<RemovalFormValues, RemovalDetails>;
}

export function RemovalForm(props: RemovalFormProps) {
  const { status } = useSession();
  const t = useTranslations('services.installation');
  // Le schéma dépend du statut : on attend la session avant de monter le formulaire
  if (status === 'loading') return <p aria-busy="true">{t('loading')}</p>;
  return <RemovalFormInner key={status} {...props} isMember={status === 'authenticated'} />;
}

function RemovalFormInner({ handle, initialValues, draft, onAutoSave, isMember }: RemovalFormProps & { isMember: boolean }) {
  const t = useTranslations('services.removal');
  const [schema] = useState(() => createRemovalSchema({ isMember }));
  // Calculé une seule fois : useForm ne lit defaultValues qu'au montage
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toRemovalFormValues(initialValues) : createEmptyRemovalForm()),
  );

  const methods = useForm<RemovalFormValues, unknown, RemovalDetails>({
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  });
  useAutoSave(methods.watch, methods.getValues, schema, onAutoSave);

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
      
      
      <form noValidate className={styles.removalForm} onSubmit={(e) => e.preventDefault()}>
        <h3 className={styles.title}><IoConstructSharp size={24} /> {t('title')}</h3>

        <MaterialsSelector />
        
        {materials.includes('frames') && <FramesSection />}
        {materials.includes('addons') && <AddonsSection />}
        {materials.includes('keybox') && <KeyboxSection />}
        {materials.includes('flags') && <FlagsSection />}
        {materials.includes('directional') && <DirectionalsSection />}
        {materials.includes('other') && <OtherSection />}

        {/* Invités : question posée une fois, juste sous les services */}
        {!isMember && <AfterRemovalQuestion />}
      </form>
    </FormProvider>
  );
}