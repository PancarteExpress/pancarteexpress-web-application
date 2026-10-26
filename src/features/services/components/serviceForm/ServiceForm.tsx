'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import AddressManager from '@/features/services/components/addressManager/AddressManager';
import { Notice, RadioGroup, type ChoiceOption } from '@/features/services/components/fields';

import { useAddressStore } from '@/features/services/store/addressStore';

import type { RequestType } from '@/features/services/types/services';
import { useCartStore } from '@/features/cart/store/cartStore';
import { AddressServices } from './AddressServices';
import styles from './ServiceForm.module.css';
import { formatAddress } from '@/features/services/utils/formatAddress';
import { ServicesSummary } from '../servicesSummary/ServicesSummary';

import { ADDRESS_LABELS } from '@/features/services/constants/installation';

const REQUEST_TYPE_OPTIONS: ChoiceOption<RequestType>[] = [
  { value: 'residential', label: 'Demande résidentielle' },
  { value: 'commercial', label: 'Grand format' },
];

export default function ServiceForm() {
  const locale = useLocale();
  const addServiceRequest = useCartStore((s) => s.addServiceRequest);

  // Sélecteurs ciblés : ce composant ne se redessine que si ces valeurs changent
  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const clearAddresses = useAddressStore((s) => s.clearAddresses);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);

  const [searchAddress, setSearchAddress] = useState('');
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const addressesWithServices = addresses.filter((a) => a.services.length > 0);

  const handleRequestTypeChange = (type: RequestType) => {
    setRequestType(type);
    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    if (requestType === null) {
      setError('Veuillez choisir le type de demande (résidentielle ou grand format)');
      return;
    }
    // Le store du panier fait une copie profonde : vider les adresses ne touche pas le panier
    addServiceRequest({ requestType, addresses: addressesWithServices });
    clearAddresses();
    setRequestType(null);
    setError(null);
    setAddedToCart(true);
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.existingService}>
        <label htmlFor="searchExistingService">
          Vous aimeriez connaître l&apos;état ou modifier une demande de service existante ?
        </label>
        <AddressAutocomplete id="searchExistingService" value={searchAddress} onChange={setSearchAddress} />
      </div>

      <div className={styles.serviceForm}>
        <RadioGroup
          legend="Faire une nouvelle demande de service"
          options={REQUEST_TYPE_OPTIONS}
          value={requestType}
          onChange={handleRequestTypeChange}
          columns={2}
        />

        {requestType === 'commercial' && <Notice>Les demandes grand format seront bientôt disponibles.</Notice>}

        {requestType === 'residential' && (
        <>
        <AddressManager />
        {selectedAddress && (<>
          <div className={styles.selectedAddress}>
            <label>Cette demande de service concerne l&apos;adresse suivante :</label>
            <p>{formatAddress(selectedAddress, ADDRESS_LABELS)}</p>
          </div>

          <AddressServices key={selectedAddress.id} address={selectedAddress} />
        </>)}
        </>
        )}

        {addedToCart && (
          <div role="status" className={styles.addedToCart}>
            <p>Votre demande a été ajoutée au panier.</p>
            <Link href={`/${locale}/cart`}>Voir le panier</Link>
          </div>
        )}
      </div>

      {addressesWithServices.length > 0 && (
        <ServicesSummary
          addresses={addressesWithServices}
          onRemoveService={removeService}
          onAddToCart={handleAddToCart}
          error={error}
        />
      )}
    </div>
  );
}