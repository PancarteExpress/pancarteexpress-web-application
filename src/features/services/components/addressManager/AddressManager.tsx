'use client'

import { useState } from 'react';
import styles from './AddressManager.module.css';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/addressAutocomplete';
import { createStreetAddress } from '../../types/address';
import { useAddresses } from '../../hooks/useAddresses';

export default function AddressManager() {

  const { addresses, selectedAddressId, setSelectedAddressId, addAddress, removeAddress } = useAddresses();

  const [typeAddress, setTypeAddress] = useState<"streetAddress" | "terrainAddress" | null>(null);

  const [address, setAddress] = useState<string>('');
  const [apartmentNumber, setApartmentNumber] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');

  const [addNewAddress, setAddNewAddress] = useState<boolean>(false);

  const handleApartmentChange = (val: string) => {
    setApartmentNumber(val === '' || val === '0' ? null : val);
  };

  const handleCancel = () => {
    setTypeAddress(null);
    setAddress('');
    setApartmentNumber(null);
    setCity('');
    setPostalCode('');

    setAddNewAddress(false);
  };

  const handleSave = () => {
    if (!address.trim()) {
      alert('Veuillez entrer une adresse');
      return;
    }

    if (!city.trim()) {
      alert('Veuillez entrer une ville');
      return;
    }

    if (!postalCode.trim()) {
      alert('Veuillez entrer un code postal');
      return;
    }

    const streetAddress = createStreetAddress({
      streetNumber: address.split(' ')[0] || '',
      streetName: address.substring(address.indexOf(' ') + 1) || '',
      apartment: apartmentNumber || undefined,
      city,
      postalCode,
    });

    addAddress(streetAddress);
    handleCancel();
  };

  return (
    <>
    <fieldset>
        <legend>Voici la liste des emplacements enregitres</legend>
        <div>
            {addresses.length === 0 ? (
                <p>Aucune adresse enregistrée</p>
              ) : (
                addresses.map((addr) => (
                  <label key={addr.id} className={styles.addressLabel}>
                    <div className={styles.address}>
                      <input 
                      type="radio" 
                      name="address" 
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)} />
                      Adresse: {addr.type === 'address' 
                        ? `${addr.streetNumber} ${addr.streetName} ${addr.apartment ? `#${addr.apartment}` : ''}`
                        : addr.description
                      }
                    </div>

                    <div className={styles.addressBtn}>
                      <button type="button" className={styles.editButton}>Modifier</button>
                      <button type="button" className={styles.deleteButton} onClick={() => removeAddress(addr.id)}>Supprimer</button>
                    </div>
                  </label>
                ))
              )}
        </div>
        <button type='button' className={styles.addAddressButton} onClick={() => setAddNewAddress(true)}>Ajouter une adresse</button>
    </fieldset>

    {addNewAddress &&
    <fieldset>
      <legend>Veuillez indiquer le type demplacement</legend>
      <div className={styles.userChoice}>
          <label className={typeAddress === 'streetAddress' ? styles.checked : ''}>
              <input type="radio" id="residential" name="typeAddress" value="streetAddress" checked={typeAddress === "streetAddress"} onChange={() => setTypeAddress("streetAddress")} /> 
              Adresse
          </label>
          <label className={typeAddress === 'terrainAddress' ? styles.checked : ''}>
              <input type="radio" id="commercial" name="typeAddress" value="terrainAddress" checked={typeAddress === "terrainAddress"} onChange={() => setTypeAddress("terrainAddress")}/>
              Terrain (sans adresse)
          </label>
      </div>

      {typeAddress === 'streetAddress' &&<>
      <div className={styles.addAddress}>
        <label>Veuillez inscrire ladresse</label>
        <div className={styles.addressDetails}>
          <div>
              <label htmlFor="civicAddress">Adresse complète <span style={{color: 'red'}}>*</span></label>
              <AddressAutocomplete 
                id="addAddress" 
                value={address} 
                onChange={setAddress}
                onCityChange={setCity}
                onPostalCodeChange={setPostalCode}
                //onStreetAddressChange={setStreetAddress}
                />
          </div>
          
          <div>
              <label htmlFor="appartmentAddress">Appartement</label>
              <input
                  id="appartmentNumber"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={apartmentNumber ?? ''}
                  onChange={(e) => handleApartmentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
          </div>
        </div>
      </div>
      </>}
      {typeAddress && <button type="button" className={styles.btnSave} onClick={handleSave}>Enregistrer</button>}
      <button type="button" className={styles.btnCancel} onClick={handleCancel}>Annuler</button>
    </fieldset>
    }
    </>
  );
}