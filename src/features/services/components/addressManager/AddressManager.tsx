'use client'

import { useState } from 'react';
import styles from './AddressManager.module.css';
import { createStreetAddress, createTerrainAddress, StreetAddress, TerrainAddress } from '../../types/address';
import { useAddresses } from '../../hooks/useAddresses';
import { ParsedAddress } from '@/shared/types/address';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';

export default function AddressManager() {

  const { addresses, selectedAddressId, setSelectedAddressId, addAddress, removeAddress, updateAddress } = useAddresses();

  const [typeAddress, setTypeAddress] = useState<"streetAddress" | "terrainAddress" | null>(null);

  const [address, setAddress] = useState<string>('');
  const [apartmentNumber, setApartmentNumber] = useState<string | null>(null);
  
  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);

  const [terrainDescription, setTerrainDescription] = useState('');
  const [terrainCity, setTerrainCity] = useState('');
  const [terrainAddress, setTerrainAddress] = useState('');

  const [addNewAddress, setAddNewAddress] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const handleApartmentChange = (val: string) => {
    setApartmentNumber(val === '' || val === '0' ? null : val);
  };

  const handleAddNewAddress = () => {
    setAddNewAddress(true);
  };

  const handleEdit = (addressId: string) => {
    setEditingAddressId(addressId);
    setSelectedAddressId(addressId);

    const addressToEdit = addresses.find(addr => addr.id === addressId);

    if (addressToEdit) {
      if (addressToEdit.type === 'address') {
        setTypeAddress('streetAddress');
        setAddress(`${addressToEdit.streetNumber} ${addressToEdit.streetName}`);
        setParsedAddress({
          streetNumber: addressToEdit.streetNumber,
          streetName: addressToEdit.streetName,
          city: addressToEdit.city,
          province: 'QC',
          postalCode: addressToEdit.postalCode,
          formatted: `${addressToEdit.streetNumber} ${addressToEdit.streetName}, ${addressToEdit.city}`,
        });
        setApartmentNumber(addressToEdit.apartment || null);
      } else if (addressToEdit.type === 'terrain') {
        setTypeAddress('terrainAddress');
        setTerrainDescription(addressToEdit.description);
        setTerrainCity(addressToEdit.city);
        setTerrainAddress(addressToEdit.nearbyAddress || '');
      }
    }

    setAddNewAddress(true);
  };

  const handleCancel = () => {
    setTypeAddress(null);

    setAddress('');
    setApartmentNumber(null);
    setParsedAddress(null);
    
    setTerrainDescription('');
    setTerrainCity('');
    setTerrainAddress('');

    setAddNewAddress(false);
    setEditingAddressId(null);
  };

  const handleSave = () => {

    let addressData: StreetAddress | TerrainAddress | null = null;

    if (typeAddress === "streetAddress") {

      if (!parsedAddress) {
        alert('Veuillez sélectionner une adresse dans la liste');
        return;
      }
      if (!parsedAddress.streetNumber || !parsedAddress.postalCode) {
        alert('Adresse incomplète : numéro civique ou code postal manquant');
        return;
      }
      
      addressData = createStreetAddress({
        streetNumber: parsedAddress.streetNumber,
        streetName: parsedAddress.streetName,
        apartment: apartmentNumber || undefined,
        city: parsedAddress.city,
        postalCode: parsedAddress.postalCode,
      });
    }
    
    if (typeAddress === "terrainAddress") {
      if (!terrainDescription.trim()) {
        alert('Veuillez entrer une description du terrain');
        return;
      }

      if (!terrainCity.trim()) {
        alert('Veuillez entrer une ville');
        return;
      }

      addressData = createTerrainAddress({
        description: terrainDescription,
        city: terrainCity,
        ...(terrainAddress && { nearbyAddress: terrainAddress }),
      });
    }

    if (addressData) {
      if (editingAddressId) {
        updateAddress(editingAddressId, addressData);
      } else {
        const newId = addAddress(addressData);  // ← Capture l'ID
        setSelectedAddressId(newId);  // ← Sélectionne-la
      }

      handleCancel();
    }
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
                      disabled={editingAddressId !== null && editingAddressId !== addr.id}
                      onChange={() => setSelectedAddressId(addr.id)} />
                        
                        {addr.type === 'address' && `Addresse : ${addr.streetNumber} ${addr.streetName} ${addr.apartment ? `#${addr.apartment}` : ''}`}
                        {addr.type === 'terrain' && `Terrain  : ${addr.description} - ${addr.city} ${addr.nearbyAddress ? `( ${addr.nearbyAddress} )` : ''}`}

                    </div>

                    <div className={styles.addressBtn}>
                      <button type="button" className={styles.editButton} onClick={() => handleEdit(addr.id)}>Modifier</button>
                      <button type="button" className={styles.deleteButton} onClick={() => removeAddress(addr.id)}>Supprimer</button>
                    </div>
                  </label>
                ))
              )}
        </div>
        <button type='button' className={styles.addAddressButton} onClick={handleAddNewAddress}>
          Ajouter une adresse
        </button>
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
                value={address}
                onChange={setAddress}
                onSelect={setParsedAddress}
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
      
      {typeAddress === 'terrainAddress' &&<>
      <div className={styles.addTerrain}>
        <label>Veuillez nous donner des details sur lemplacement du terrain</label>

        <div className={styles.terrainDetails}>
          <div>
              <label htmlFor="terrainDescription">Description de lemplacement du terrain <span style={{color: 'red'}}>*</span></label>
              <textarea id="terrainDescription" value={terrainDescription} onChange={(e) => setTerrainDescription(e.target.value)}/>
          </div>
      
          <div>
              <label htmlFor="terrainCity">Ville <span style={{color: 'red'}}>*</span></label>
              <input id="terrainCity" type="text" value={terrainCity} onChange={(e) => setTerrainCity(e.target.value)}/>
          </div>

          <div className={styles.inputs}>
              <div>
                  <label htmlFor="terrainAddress">
                    Adresse complète <span className={styles.info}>Vous pouvez ajouter une adresse avoisinante pour faciliter la localisation du terrain</span>
                  </label>
                  <AddressAutocomplete id="terrainAddress" value={terrainAddress} onChange={setTerrainAddress}/>
              </div>
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