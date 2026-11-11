'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { LARGE_FORMAT_SERVICES, type LargeFormatServiceType } from '@/features/services/constants/largeFormat';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
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
import { useServiceSelection } from './useServiceSelection';

type Find<T extends Service['type']> = Extract<Service, { type: T }>;

/**
 * Services grand format d'une adresse, enregistrés automatiquement à chaque modification.
 * Même fonctionnement que AddressServices (résidentiel).
 */
export function LargeAddressServices({ address }: { address: Address }) {
  const t = useTranslations('services');
  const saveService = useAddressStore((s) => s.saveService);

  const find = <T extends LargeFormatServiceType>(type: T) =>
    address.services.find((s): s is Find<T> => s.type === type);
  const installation = find('largeInstallation');
  const storagePickup = find('largeStoragePickup');
  const retrieval = find('largeRetrieval');

  const installationRef = useRef<ServiceFormHandle<LargeInstallationDetails>>(null);
  const storagePickupRef = useRef<ServiceFormHandle<LargeStoragePickupDetails>>(null);
  const retrievalRef = useRef<ServiceFormHandle<LargeRetrievalDetails>>(null);

  const { selected, handleServicesChange, recordDraft, drafts } = useServiceSelection(
    address,
    LARGE_FORMAT_SERVICES,
    () => {
      void installationRef.current?.submit();
      void storagePickupRef.current?.submit();
      void retrievalRef.current?.submit();
    },
  );

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
          key="largeInstallation"
          handle={installationRef}
          initialValues={installation}
          draft={drafts?.largeInstallation?.values}
          onAutoSave={(values, details) => {
            recordDraft('largeInstallation', values, details !== null);
            if (details) saveService(address.id, { type: 'largeInstallation', ...details });
          }}
        />
      )}

      {selected.includes('largeStoragePickup') && (
        <LargeStoragePickupForm
          key="largeStoragePickup"
          handle={storagePickupRef}
          initialValues={storagePickup}
          draft={drafts?.largeStoragePickup?.values}
          onAutoSave={(values, details) => {
            recordDraft('largeStoragePickup', values, details !== null);
            if (details) saveService(address.id, { type: 'largeStoragePickup', ...details });
          }}
        />
      )}

      {selected.includes('largeRetrieval') && (
        <LargeRetrievalForm
          key="largeRetrieval"
          handle={retrievalRef}
          initialValues={retrieval}
          draft={drafts?.largeRetrieval?.values}
          onAutoSave={(values, details) => {
            recordDraft('largeRetrieval', values, details !== null);
            if (details) saveService(address.id, { type: 'largeRetrieval', ...details });
          }}
        />
      )}
    </>
  );
}
