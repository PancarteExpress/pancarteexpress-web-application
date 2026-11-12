'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmptyInstallationForm, createInstallationSchema, toInstallationFormValues, type InstallationFormValues, } from '../../schemas/installation.schema';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';
import type { InstallationDetails } from '../../types/installation';
import { getFullName } from '@/shared/utils/displayName';
import styles from './installationForm.module.css';
import { MaterialsSelector } from './materials/MaterialsSelector';

import { FramesSection } from './materials/frames/FramesSection';
import { KitSection } from './materials/kits/KitSection';
import { AddonsSection } from './materials/addons/AddonsSection';
import { OpenHouseSection } from './materials/openHouse/OpenHouseSection';
import { AssignmentsSection } from './materials/assignments/AssignmentsSection';
import { DirectionalsSection } from './materials/directionals/DirectionalsSection';
import { FlagsSection } from './materials/flags/FlagsSection';
import { KeyboxSection } from './materials/keybox/KeyboxSection';
import { OtherSection } from './materials/other/OtherSection';

import { IoConstructSharp } from "react-icons/io5";

interface InstallationFormProps {
  handle: Ref<ServiceFormHandle<InstallationDetails>>;
  initialValues?: InstallationDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: InstallationFormValues;
  onAutoSave: AutoSaveHandler<InstallationFormValues, InstallationDetails>;
}

export function InstallationForm({ handle, initialValues, draft, onAutoSave }: InstallationFormProps) {
  const { data: session, status } = useSession();
  const t = useTranslations('services.installation');
  
  if (status === 'loading') return <p aria-busy="true">{t('loading')}</p>;

  const user = status === 'authenticated' ? session.user : undefined;
  // Les comptes stockent prénom et nom séparément ; `name` sert de repli
  const accountName = getFullName(user) || user?.name?.trim() || null;

  return (
    <InstallationFormInner
      key={`${status}:${accountName ?? ''}`}
      handle={handle}
      isMember={status === 'authenticated'}
      accountName={accountName}
      initialValues={initialValues}
      draft={draft}
      onAutoSave={onAutoSave}
    />
  );
}

interface InnerProps extends InstallationFormProps {
  isMember: boolean;
  accountName: string | null;
}

function InstallationFormInner({ handle, initialValues, draft, onAutoSave, isMember, accountName }: InnerProps) {
  const t = useTranslations('services.installation');
  const [schema] = useState(() => createInstallationSchema({ isMember, accountName }));
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toInstallationFormValues(initialValues) : createEmptyInstallationForm()),
  );
  const methods = useForm<InstallationFormValues, unknown, InstallationDetails>({
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  });

  const materials = useWatch({ control: methods.control, name: 'materials' });
  const { handleSubmit } = methods;
  useAutoSave(methods.watch, methods.getValues, schema, onAutoSave);

  useImperativeHandle(handle, () => ({
    // handleSubmit valide, affiche les erreurs et place le focus sur la première
    submit: () =>
      new Promise<InstallationDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <FormProvider {...methods}>
      <form noValidate className={styles.installationForm} onSubmit={(e) => e.preventDefault()}>
        <h3 className={styles.title}><IoConstructSharp size={24} /> {t('title')}</h3>

        <MaterialsSelector />
        
        {materials.includes('frames') && <FramesSection isMember={isMember} accountName={accountName} />}
        {materials.includes('kit') && <KitSection />}
        {materials.includes('addons') && <AddonsSection />}
        {materials.includes('openHouse') && <OpenHouseSection />}
        {materials.includes('keybox') && <KeyboxSection />}
        {materials.includes('flags') && <FlagsSection />}
        {materials.includes('directional') && <DirectionalsSection />}
        {materials.includes('other') && <OtherSection />}
        <AssignmentsSection />
      </form>
    </FormProvider>
  );
}