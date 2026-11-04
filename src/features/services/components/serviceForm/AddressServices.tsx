'use client';

import { useRef, useState } from 'react';
import { IMPLEMENTED_SERVICES, SERVICE_LABELS, SERVICE_CHOICES, type ServiceType, } from '@/features/services/constants/installation';
import { CheckboxGroup, Notice, type ChoiceOption } from '@/features/services/components/fields';

import { useAddressStore } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';

import { InstallationForm } from '@/features/services/components/installationForm/InstallationForm';
import { RemovalForm } from '@/features/services/components/removalForm/RemovalForm';
import { CorrectionForm } from '@/features/services/components/correctionForm/CorrectionForm';
import { PickupForm } from '@/features/services/components/pickupForm/PickupForm';

import type { InstallationDetails } from '@/features/services/types/installation';
import type { RemovalDetails } from '@/features/services/types/removal';
import type { CorrectionDetails } from '@/features/services/types/correction';
import type { PickupDetails } from '@/features/services/types/pickup';

import type { ServiceFormHandle } from './serviceFormHandle';

import styles from '../installationForm/installationForm.module.css';

type InstallationService = Extract<Service, { type: 'installation' }>;
type RemovalService = Extract<Service, { type: 'removal' }>;
type CorrectionService = Extract<Service, { type: 'correction' }>;
type PickupService = Extract<Service, { type: 'pickup' }>;

type SavedIds = Partial<Record<ServiceType, string>>;

const IMPLEMENTED: readonly ServiceType[] = IMPLEMENTED_SERVICES;

const SERVICE_OPTIONS: ChoiceOption<ServiceType>[] = SERVICE_CHOICES.map((type) => ({
  value: type,
  label: SERVICE_LABELS[type],
  disabled: !IMPLEMENTED.includes(type),
}));

/** Monté avec key={address.id} : l'état local repart de zéro à chaque changement d'adresse. */
export function AddressServices({ address }: { address: Address }) {
  const saveService = useAddressStore((s) => s.saveService);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);

  const installation = address.services.find((s): s is InstallationService => s.type === 'installation');
  const removal = address.services.find((s): s is RemovalService => s.type === 'removal');
  const correction = address.services.find((s): s is CorrectionService => s.type === 'correction');
  const pickup = address.services.find((s): s is PickupService => s.type === 'pickup');
  const savedIds: SavedIds = {
    installation: installation?.id, removal: removal?.id, correction: correction?.id, pickup: pickup?.id,
  };

  const [selected, setSelected] = useState<ServiceType[]>(() => IMPLEMENTED.filter((t) => savedIds[t]));
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const installationRef = useRef<ServiceFormHandle<InstallationDetails>>(null);
  const removalRef = useRef<ServiceFormHandle<RemovalDetails>>(null);
  const correctionRef = useRef<ServiceFormHandle<CorrectionDetails>>(null);
  const pickupRef = useRef<ServiceFormHandle<PickupDetails>>(null);

  // Service supprimé ailleurs (ex. depuis le résumé) : on le décoche, pendant le rendu
  const [prevIds, setPrevIds] = useState<SavedIds>(savedIds);
  if (IMPLEMENTED.some((t) => prevIds[t] !== savedIds[t])) {
    const removed = IMPLEMENTED.filter((t) => prevIds[t] && !savedIds[t]);
    setPrevIds(savedIds);
    if (removed.length > 0) setSelected((s) => s.filter((t) => !removed.includes(t)));
  }

  const handleServicesChange = (next: ServiceType[]) => {
    const removing = selected.flatMap((type) => {
      const id = savedIds[type];
      return !next.includes(type) && id ? [{ type, id }] : [];
    });

    for (const { type } of removing) {
      if (!window.confirm(`Supprimer le service « ${SERVICE_LABELS[type]} » enregistré pour cette adresse ?`)) return;
    }
    removing.forEach(({ id }) => removeService(address.id, id));
    setSelected(next);
    setJustSaved(false);
  };

  /** Valide tous les services cochés ; n'enregistre que si tous sont valides */
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // undefined = service non coché ; null = invalide (erreurs affichées dans son formulaire)
      const [installation, removal, correction, pickup] = await Promise.all([
        selected.includes('installation') ? (installationRef.current?.submit() ?? null) : undefined,
        selected.includes('removal') ? (removalRef.current?.submit() ?? null) : undefined,
        selected.includes('correction') ? (correctionRef.current?.submit() ?? null) : undefined,
        selected.includes('pickup') ? (pickupRef.current?.submit() ?? null) : undefined,
      ]);
      if (installation === null || removal === null || correction === null || pickup === null) {
        setJustSaved(false);
        return;
      }

      if (installation) saveService(address.id, { type: 'installation', ...installation });
      if (removal) saveService(address.id, { type: 'removal', ...removal });
      if (correction) saveService(address.id, { type: 'correction', ...correction });
      if (pickup) saveService(address.id, { type: 'pickup', ...pickup });
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  };

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
        <InstallationForm key={`installation-${installation?.id ?? 'new'}`} handle={installationRef} initialValues={installation} />
      )}

      {selected.includes('removal') && (
        <RemovalForm key={`removal-${removal?.id ?? 'new'}`} handle={removalRef} initialValues={removal} />
      )}

      {selected.includes('correction') && (
        <CorrectionForm key={`correction-${correction?.id ?? 'new'}`} handle={correctionRef} initialValues={correction} />
      )}

      {selected.includes('pickup') && (
        <PickupForm key={`pickup-${pickup?.id ?? 'new'}`} handle={pickupRef} initialValues={pickup} />
      )}

      {selected.length > 0 && (
        <button type="button" className={styles.submit} onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les services'}
        </button>
      )}

      {justSaved && (
        <div role="status">
          <Notice>Services enregistrés.</Notice>
        </div>
      )}
    </>
  );
}