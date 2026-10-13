'use client';

import { useState } from 'react';
import { SERVICE_LABELS, SERVICE_TYPES, type ServiceType } from '@/features/services/constants/installation';
import { CheckboxGroup, Notice, type ChoiceOption } from '@/features/services/components/fields';
import { InstallationForm } from '@/features/services/components/installationForm/InstallationForm';
import { useAddressStore } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';

type InstallationService = Extract<Service, { type: 'installation' }>;

const SERVICE_OPTIONS: ChoiceOption<ServiceType>[] = SERVICE_TYPES.map((type) => ({
  value: type,
  label: SERVICE_LABELS[type],
  disabled: type !== 'installation',
}));

/** Monté avec key={address.id} : l'état local repart de zéro à chaque changement d'adresse. */
export function AddressServices({ address }: { address: Address }) {
  const saveInstallation = useAddressStore((s) => s.saveInstallation);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);

  const installation = address.services.find((s): s is InstallationService => s.type === 'installation');

  const [selected, setSelected] = useState<ServiceType[]>(() => (installation ? ['installation'] : []));
  const [saved, setSaved] = useState(false);

  const handleServicesChange = (next: ServiceType[]) => {
    const removing = selected.includes('installation') && !next.includes('installation');
    if (removing && installation) {
      if (!window.confirm("Supprimer l'installation enregistrée pour cette adresse ?")) return;
      removeService(address.id, installation.id);
      setSaved(false);
    }
    setSelected(next);
  };

  // Installation supprimée ailleurs (ex. depuis le résumé) : on décoche
  const installationId = installation?.id ?? null;
  const [prevInstallationId, setPrevInstallationId] = useState(installationId);
  if (installationId !== prevInstallationId) {
    setPrevInstallationId(installationId);
    if (installationId === null) {
      setSelected((s) => s.filter((t) => t !== 'installation'));
      setSaved(false);
    }
  }

  return (
    <>
      <CheckboxGroup
        legend="Quels sont les services dont vous avez besoin pour l'adresse sélectionnée ?"
        options={SERVICE_OPTIONS}
        value={selected}
        onChange={handleServicesChange}
        hint="Les autres services seront offerts prochainement."
      />

      {selected.includes('installation') && (
        <InstallationForm
          // 'new' → id après le 1er enregistrement : remontage unique avec les données sauvegardées
          key={installation?.id ?? 'new'}
          initialValues={installation}
          onSubmit={(details) => {
            saveInstallation(address.id, details);
            setSaved(true);
          }}
        />
      )}

      {saved && (
        <div role="status">
          <Notice>Installation enregistrée.</Notice>
        </div>
      )}
    </>
  );
}