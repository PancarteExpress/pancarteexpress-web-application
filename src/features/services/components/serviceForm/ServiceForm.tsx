'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { inlineLoading } from '@/shared/components/deferredLoading/DeferredLoading';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { toOptions } from '@/features/services/components/fields/types';

import type { CartAddress } from '@/features/cart/types/cart';
import { createEmptyScheduleForm, createScheduleSchema } from '@/features/services/schemas/schedule.schema';

import { useAddressStore } from '@/features/services/store/addressStore';

import { REQUEST_TYPES } from '@/lib/orders/constants';
import type { RequestType } from '@/features/services/types/services';
import { useCartStore } from '@/features/cart/store/cartStore';
import styles from './ServiceForm.module.css';
import { formatAddress } from '@/features/services/utils/formatAddress';
import { ServicesSummary } from '../servicesSummary/ServicesSummary';

import { addressesWithServicesOf, requestTypeOf } from '@/features/services/utils/serviceRequestType';
import type { ServiceKey } from '@/features/services/store/addressStore';

const AddressManager = dynamic(() => import('@/features/services/components/addressManager/AddressManager'), { loading: inlineLoading });
const AddressServices = dynamic(() => import('./AddressServices').then((m) => m.AddressServices), { loading: inlineLoading });
// Recherche d'une commande : visiteurs non connectés seulement, chargée à la demande
const OrderLookup = dynamic(() => import('../orderLookup/OrderLookup').then((m) => m.OrderLookup), { loading: inlineLoading });
const LargeAddressServices = dynamic(() => import('./LargeAddressServices').then((m) => m.LargeAddressServices), { loading: inlineLoading });

export default function ServiceForm() {
  const locale = useLocale();
  const t = useTranslations('services');
  const { status: sessionStatus } = useSession();
  const addServiceRequest = useCartStore((s) => s.addServiceRequest);

  // Sélecteurs ciblés : ce composant ne se redessine que si ces valeurs changent
  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const clearServicesOf = useAddressStore((s) => s.clearServicesOf);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);
  const drafts = useAddressStore((s) => s.drafts);
  const clearDraft = useAddressStore((s) => s.clearDraft);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);
  const requestValidation = useAddressStore((s) => s.requestValidation);

  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  // Services complets : ce qui part au panier
  const addressesWithServices = requestType ? addressesWithServicesOf(addresses, requestType) : [];

  // Services de ce type de demande dont la saisie en cours est incomplète, par adresse
  const incomplete: Record<string, ServiceKey[]> = {};
  if (requestType) {
    for (const [addressId, addressDrafts] of Object.entries(drafts)) {
      const types = (Object.keys(addressDrafts) as ServiceKey[]).filter(
        (type) => addressDrafts[type]?.complete === false && requestTypeOf({ type }) === requestType,
      );
      if (types.length > 0) incomplete[addressId] = types;
    }
  }

  // Résumé : adresses avec des services complets ou en cours de saisie
  const summaryAddresses = requestType
    ? addresses
        .map((a) => ({ ...a, services: a.services.filter((s) => requestTypeOf(s) === requestType) }))
        .filter((a) => a.services.length > 0 || incomplete[a.id])
    : [];


  const handleRequestTypeChange = (type: RequestType) => {
    setRequestType(type);
    setAddedToCart(false);
  };

  const handleAddToCart = async () => {
    if (requestType === null) {
      setError(t('serviceForm.requestTypeRequired'));
      return;
    }
    // Service incomplet : on ouvre la première adresse concernée et ses formulaires affichent leurs erreurs
    const firstIncomplete = summaryAddresses.find((a) => incomplete[a.id]);
    if (firstIncomplete) {
      setError(t('serviceForm.incompleteServices'));
      setSelectedAddressId(firstIncomplete.id);
      requestValidation();
      return;
    }

    // Délai de chaque adresse, validé maintenant : une date précise a pu passer depuis la saisie
    const schema = createScheduleSchema();
    const cartAddresses: CartAddress[] = [];
    for (const address of addressesWithServices) {
      const { scheduleDraft, ...rest } = address;
      if (requestType === 'commercial') {
        cartAddresses.push({ ...rest, schedule: null }); // grand format : aucun délai
        continue;
      }
      const result = schema.safeParse(scheduleDraft ?? createEmptyScheduleForm());
      if (!result.success) {
        setError(t('serviceForm.invalidSchedule'));
        setSelectedAddressId(address.id);
        requestValidation();
        return;
      }
      cartAddresses.push({ ...rest, schedule: result.data });
    }

    // Le store du panier fait une copie profonde : vider les adresses ne touche pas le panier
    addServiceRequest({ requestType, addresses: cartAddresses });
    clearServicesOf(requestType);
    setRequestType(null);
    setError(null);
    setAddedToCart(true);
  };

  return (
    <div className={styles.mainContainer}>
      {sessionStatus === 'unauthenticated' && <OrderLookup />}

      <div className={styles.serviceForm}>
        <RadioGroup
          legend={t('serviceForm.requestTypeLegend')}
          options={toOptions(REQUEST_TYPES, (type) => t(`requestTypes.${type}`))}
          value={requestType}
          onChange={handleRequestTypeChange}
          columns={2}
        />
        {requestType !== null && (
        <>
        <AddressManager />
        {selectedAddress && (<>
          <div className={styles.selectedAddress}>
            <label>{t('serviceForm.selectedAddress')}</label>
            <p>{formatAddress(selectedAddress, { terrain: t('address.terrain'), near: t('address.near'), apartment: t('address.apartment') })}</p>
          </div>

          {requestType === 'residential'
            ? <AddressServices key={selectedAddress.id} address={selectedAddress} />
            : <LargeAddressServices key={selectedAddress.id} address={selectedAddress} />}
         </>)}
        </>
        )}

        {addedToCart && (
          <div role="status" className={styles.addedToCart}>
            <p>{t('serviceForm.addedToCart')}</p>
            <Link href={`/${locale}/cart`}>{t('serviceForm.viewCart')}</Link>
          </div>
        )}
      </div>

      {summaryAddresses.length > 0 && (
        <>
          <ServicesSummary
            addresses={summaryAddresses}
            incomplete={incomplete}
            showSchedule={requestType === 'residential'}
            onRemoveService={removeService}
            onRemoveDraft={clearDraft}
            onAddToCart={handleAddToCart}
            error={error}
          />
        </>
      )}
    </div>
  );
}