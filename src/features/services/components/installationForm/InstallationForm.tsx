'use client';

import { useImperativeHandle, useState, type Ref } from 'react';
import { useSession } from 'next-auth/react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmptyInstallationForm, createInstallationSchema, toInstallationFormValues, type InstallationFormValues, } from '../../schemas/installation.schema';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import type { InstallationDetails } from '../../types/installation';
import styles from './installationForm.module.css';
import { MaterialsSelector } from './MaterialsSelector';

import { FramesSection } from './frames/FramesSection';
import { KitSection } from './kits/KitSection';
import { AddonsSection } from './addons/AddonsSection';
import { PlacementFields } from './PlacementFields';
import { OpenHouseSection } from './openHouse/OpenHouseSection';
import { AssignmentsSection } from './assignments/AssignmentsSection';
import { DirectionalsSection } from './directionals/DirectionalsSection';
import { FlagsSection } from './flags/FlagsSection';
import { KeyboxSection } from './keybox/KeyboxSection';
import { OtherSection } from './other/OtherSection';

interface InstallationFormProps {
  handle: Ref<ServiceFormHandle<InstallationDetails>>;
  initialValues?: InstallationDetails;
}

export function InstallationForm({ handle, initialValues }: InstallationFormProps) {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <p aria-busy="true">Chargement…</p>;

  const user = status === 'authenticated' ? session.user : undefined;
  // Les comptes stockent prénom et nom séparément ; `name` sert de repli
  const accountName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.name?.trim() ||
    null;

  return (
    <InstallationFormInner
      key={`${status}:${accountName ?? ''}`}
      handle={handle}
      isMember={status === 'authenticated'}
      accountName={accountName}
      initialValues={initialValues}
    />
  );
}

interface InnerProps extends InstallationFormProps {
  isMember: boolean;
  accountName: string | null;
}

function InstallationFormInner({ handle, initialValues, isMember, accountName }: InnerProps) {
  const [schema] = useState(() => createInstallationSchema({ isMember, accountName }));
  const [defaultValues] = useState(() => initialValues ? toInstallationFormValues(initialValues) : createEmptyInstallationForm(),);
  const methods = useForm<InstallationFormValues, unknown, InstallationDetails>({
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  });

  const materials = useWatch({ control: methods.control, name: 'materials' });
  const { handleSubmit } = methods;

  useImperativeHandle(handle, () => ({
    // handleSubmit valide, affiche les erreurs et place le focus sur la première
    submit: () =>
      new Promise<InstallationDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <FormProvider {...methods}>
      <form noValidate className={styles.form} onSubmit={(e) => e.preventDefault()}>
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
        {materials.length > 0 && <PlacementFields />}
      </form>
    </FormProvider>
  );
}