'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LARGE_FORMAT_SERVICES, type LargeFormatServiceType } from '@/features/services/constants/largeFormat';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
import { Notice } from '@/features/services/components/fields/Notice';
import { toOptions } from '@/features/services/components/fields/types';
import { useAddressStore } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';
import type {
  LargeInstallationDetails, LargeRetrievalDetails, LargeStoragePickupDetails,
} from '@/features/services/types/largeFormat';
import { LargeInstallationForm } from '../largeFormatForms/LargeInstallationForm';
import { LargeRetrievalForm } from '../largeFormatForms/LargeRetrievalForm';
import { LargeStoragePickupForm } from '../largeFormatForms/LargeStoragePickupForm';
import type { ServiceFormHandle } from './serviceFormHandle';
import styles from '../installationForm/installationForm.module.css';

type LargeInstallationService = Extract<Service, { type: 'largeInstallation' }>;
type LargeStoragePickupService = Extract<Service, { type: 'largeStoragePickup' }>;
type LargeRetrievalService = Extract<Service, { type: 'largeRetrieval' }>;
type SavedIds = Partial<Record<LargeFormatServiceType, string>>;

/**
 * Services grand format d'une adresse. Même fonctionnement que AddressServices (résidentiel) :
 * monté avec key={address.id}, un seul bouton enregistre tous les services cochés.
 */
export function LargeAddressServices({ address }: { address: Address }) {
  const t = useTranslations('services');
  const saveService = useAddressStore((s) => s.saveService);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);

  const installation = address.services.find((s): s is LargeInstallationService => s.type === 'largeInstallation');
  const storagePickup = address.services.find((s): s is LargeStoragePickupService => s.type === 'largeStoragePickup');
  const retrieval = address.services.find((s): s is LargeRetrievalService => s.type === 'largeRetrieval');
  const savedIds: SavedIds = {
    largeInstallation: installation?.id,
    largeStoragePickup: storagePickup?.id,
    largeRetrieval: retrieval?.id,
  };

  const [selected, setSelected] = useState<LargeFormatServiceType[]>(() => LARGE_FORMAT_SERVICES.filter((t) => savedIds[t]));
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const installationRef = useRef<ServiceFormHandle<LargeInstallationDetails>>(null);
  const storagePickupRef = useRef<ServiceFormHandle<LargeStoragePickupDetails>>(null);
  const retrievalRef = useRef<ServiceFormHandle<LargeRetrievalDetails>>(null);

  // Service supprimé ailleurs (ex. depuis le résumé) : on le décoche, pendant le rendu
  const [prevIds, setPrevIds] = useState<SavedIds>(savedIds);
  if (LARGE_FORMAT_SERVICES.some((t) => prevIds[t] !== savedIds[t])) {
    const removed = LARGE_FORMAT_SERVICES.filter((t) => prevIds[t] && !savedIds[t]);
    setPrevIds(savedIds);
    if (removed.length > 0) setSelected((s) => s.filter((t) => !removed.includes(t)));
  }

  const handleServicesChange = (next: LargeFormatServiceType[]) => {
    const removing = selected.flatMap((type) => {
      const id = savedIds[type];
      return !next.includes(type) && id ? [{ type, id }] : [];
    });
    for (const { type } of removing) {
      if (!window.confirm(t('serviceForm.confirmRemoveService', { service: t(`serviceTypes.${type}`) }))) return;
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
      const [installationDetails, storagePickupDetails, retrievalDetails] = await Promise.all([
        selected.includes('largeInstallation') ? (installationRef.current?.submit() ?? null) : undefined,
        selected.includes('largeStoragePickup') ? (storagePickupRef.current?.submit() ?? null) : undefined,
        selected.includes('largeRetrieval') ? (retrievalRef.current?.submit() ?? null) : undefined,
      ]);
      if (installationDetails === null || storagePickupDetails === null || retrievalDetails === null) {
        setJustSaved(false);
        return;
      }

      if (installationDetails) saveService(address.id, { type: 'largeInstallation', ...installationDetails });
      if (storagePickupDetails) saveService(address.id, { type: 'largeStoragePickup', ...storagePickupDetails });
      if (retrievalDetails) saveService(address.id, { type: 'largeRetrieval', ...retrievalDetails });
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CheckboxGroup
        legend={t('serviceForm.servicesLegend')}
        options={toOptions(LARGE_FORMAT_SERVICES, (type) => t(`serviceTypes.${type}`))}
        value={selected}
        onChange={handleServicesChange}
      />

      {selected.includes('largeInstallation') && (
        <LargeInstallationForm
          key={`largeInstallation-${installation?.id ?? 'new'}`}
          handle={installationRef}
          initialValues={installation}
        />
      )}

      {selected.includes('largeStoragePickup') && (
        <LargeStoragePickupForm
          key={`largeStoragePickup-${storagePickup?.id ?? 'new'}`}
          handle={storagePickupRef}
          initialValues={storagePickup}
        />
      )}

      {selected.includes('largeRetrieval') && (
        <LargeRetrievalForm
          key={`largeRetrieval-${retrieval?.id ?? 'new'}`}
          handle={retrievalRef}
          initialValues={retrieval}
        />
      )}

      {selected.length > 0 && (
        <button type="button" className={styles.submit} onClick={handleSaveAll} disabled={saving}>
          {saving ? t('serviceForm.saving') : t('serviceForm.saveServices')}
        </button>
      )}

      {justSaved && (
        <div role="status">
          <Notice>{t('serviceForm.servicesSaved')}</Notice>
        </div>
      )}
    </>
  );
}
