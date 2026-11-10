'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { inlineLoading } from '@/shared/components/deferredLoading/DeferredLoading';
import { Notice } from '@/features/services/components/fields/Notice';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { toOptions } from '@/features/services/components/fields/types';

import { useRef } from 'react';
import type { ServiceSchedule } from '@/features/services/types/schedule';
import type { ServiceFormHandle } from './serviceFormHandle';
import { ScheduleForm } from '../scheduleForm/ScheduleForm';

import { useAddressStore } from '@/features/services/store/addressStore';

import { REQUEST_TYPES } from '@/lib/orders/constants';
import type { RequestType } from '@/features/services/types/services';
import { useCartStore } from '@/features/cart/store/cartStore';
import styles from './ServiceForm.module.css';
import { formatAddress } from '@/features/services/utils/formatAddress';
import { ServicesSummary } from '../servicesSummary/ServicesSummary';

import { addressesWithServicesOf } from '@/features/services/utils/serviceRequestType';

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

  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const addressesWithServices = requestType ? addressesWithServicesOf(addresses, requestType) : [];

  const scheduleRef = useRef<ServiceFormHandle<ServiceSchedule>>(null);
  // Incrémentée après chaque ajout au panier : le délai repart de « Standard 24 h »
  const [scheduleKey, setScheduleKey] = useState(0);

  const handleRequestTypeChange = (type: RequestType) => {
    setRequestType(type);
    setAddedToCart(false);
  };

  const handleAddToCart = async () => {
    if (requestType === null) {
      setError(t('serviceForm.requestTypeRequired'));
      return;
    }
    let schedule = null;
    if (requestType === 'residential') {
      schedule = await scheduleRef.current?.submit();
      if (!schedule) return; // erreurs affichées dans le formulaire du délai
    }

    // Le store du panier fait une copie profonde : vider les adresses ne touche pas le panier
    addServiceRequest({ requestType, addresses: addressesWithServices, schedule });
    clearServicesOf(requestType);
    setRequestType(null);
    setError(null);
    setAddedToCart(true);
    setScheduleKey((k) => k + 1);
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

      {addressesWithServices.length > 0 && (
        <>
          {requestType === 'residential' && <ScheduleForm key={scheduleKey} handle={scheduleRef} />}
          <ServicesSummary
            addresses={addressesWithServices}
            onRemoveService={removeService}
            onAddToCart={handleAddToCart}
            error={error}
          />
        </>
      )}
    </div>
  );
}