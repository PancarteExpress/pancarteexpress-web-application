'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { IMPLEMENTED_SERVICES, SERVICE_CHOICES, type ServiceType } from '@/features/services/constants/installation';
import { CheckboxGroup, type ChoiceOption } from '@/features/services/components/fields';

import { useAddressStore } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';

import { InstallationForm } from '@/features/services/components/installationForm/InstallationForm';
import { RemovalForm } from '@/features/services/components/removalForm/RemovalForm';
import { CorrectionForm } from '@/features/services/components/correctionForm/CorrectionForm';
import { PickupForm } from '@/features/services/components/pickupForm/PickupForm';
import { DeliveryForm } from '@/features/services/components/deliveryForm/DeliveryForm';
import { ScheduleForm } from '@/features/services/components/scheduleForm/ScheduleForm';

import type { InstallationDetails } from '@/features/services/types/installation';
import type { RemovalDetails } from '@/features/services/types/removal';
import type { CorrectionDetails } from '@/features/services/types/correction';
import type { PickupDetails } from '@/features/services/types/pickup';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import type { ServiceSchedule } from '@/features/services/types/schedule';

import type { ServiceFormHandle } from './serviceFormHandle';
import { useServiceSelection } from './useServiceSelection';

type Find<T extends Service['type']> = Extract<Service, { type: T }>;

const IMPLEMENTED: readonly ServiceType[] = IMPLEMENTED_SERVICES;

/**
 * Services résidentiels d'une adresse, enregistrés automatiquement à chaque modification.
 * Monté avec key={address.id} : l'état local repart de zéro à chaque changement d'adresse.
 */
export function AddressServices({ address }: { address: Address }) {
  const t = useTranslations('services');
  const saveService = useAddressStore((s) => s.saveService);
  const setAddressSchedule = useAddressStore((s) => s.setAddressSchedule);

  const serviceOptions: ChoiceOption<ServiceType>[] = SERVICE_CHOICES.map((type) => ({
    value: type,
    label: t(`serviceTypes.${type}`),
    disabled: !IMPLEMENTED.includes(type),
  }));

  const find = <T extends ServiceType>(type: T) =>
    address.services.find((s): s is Find<T> => s.type === type);
  const installation = find('installation');
  const removal = find('removal');
  const correction = find('correction');
  const pickup = find('pickup');
  const delivery = find('delivery');

  const installationRef = useRef<ServiceFormHandle<InstallationDetails>>(null);
  const removalRef = useRef<ServiceFormHandle<RemovalDetails>>(null);
  const correctionRef = useRef<ServiceFormHandle<CorrectionDetails>>(null);
  const pickupRef = useRef<ServiceFormHandle<PickupDetails>>(null);
  const deliveryRef = useRef<ServiceFormHandle<DeliveryDetails>>(null);
  const scheduleRef = useRef<ServiceFormHandle<ServiceSchedule>>(null);

  const { selected, handleServicesChange, recordDraft, drafts } = useServiceSelection(address, IMPLEMENTED, () => {
    // Affiche les erreurs de chaque formulaire coché
    for (const ref of [installationRef, removalRef, correctionRef, pickupRef, deliveryRef]) void ref.current?.submit();
    void scheduleRef.current?.submit();
  });

  return (
    <>
      <CheckboxGroup
        legend={t('serviceForm.servicesLegend')}
        options={serviceOptions}
        value={selected}
        onChange={handleServicesChange}
        hint={IMPLEMENTED.length < SERVICE_CHOICES.length ? t('serviceForm.otherServicesSoon') : undefined}
      />

      {/* Clé stable par type : le formulaire n'est pas recréé quand le service reçoit son id */}
      {selected.includes('installation') && (
        <InstallationForm
          key="installation"
          handle={installationRef}
          initialValues={installation}
          draft={drafts?.installation?.values}
          onAutoSave={(values, details) => {
            recordDraft('installation', values, details !== null);
            if (details) saveService(address.id, { type: 'installation', ...details });
          }}
        />
      )}

      {selected.includes('removal') && (
        <RemovalForm
          key="removal"
          handle={removalRef}
          initialValues={removal}
          draft={drafts?.removal?.values}
          onAutoSave={(values, details) => {
            recordDraft('removal', values, details !== null);
            if (details) saveService(address.id, { type: 'removal', ...details });
          }}
        />
      )}

      {selected.includes('correction') && (
        <CorrectionForm
          key="correction"
          handle={correctionRef}
          initialValues={correction}
          draft={drafts?.correction?.values}
          onAutoSave={(values, details) => {
            recordDraft('correction', values, details !== null);
            if (details) saveService(address.id, { type: 'correction', ...details });
          }}
        />
      )}

      {selected.includes('pickup') && (
        <PickupForm
          key="pickup"
          handle={pickupRef}
          initialValues={pickup}
          draft={drafts?.pickup?.values}
          onAutoSave={(values, details) => {
            recordDraft('pickup', values, details !== null);
            if (details) saveService(address.id, { type: 'pickup', ...details });
          }}
        />
      )}

      {selected.includes('delivery') && (
        <DeliveryForm
          key="delivery"
          handle={deliveryRef}
          initialValues={delivery}
          draft={drafts?.delivery?.values}
          onAutoSave={(values, details) => {
            recordDraft('delivery', values, details !== null);
            if (details) saveService(address.id, { type: 'delivery', ...details });
          }}
        />
      )}

      {/* Délai propre à cette adresse, dès qu'un service est coché */}
      {selected.length > 0 && (
        <ScheduleForm
          key="schedule"
          handle={scheduleRef}
          draft={address.scheduleDraft}
          onAutoSave={(values) => setAddressSchedule(address.id, values)}
        />
      )}
    </>
  );
}
