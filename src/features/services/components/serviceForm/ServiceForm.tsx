'use client'
import AddressAutocomplete from '@/shared/components/addressAutocomplete/addressAutocomplete';
import styles from './ServiceForm.module.css'
import { useCallback, useEffect, useState } from 'react';
import AddressManager from '@/features/services/components/addressManager/AddressManager';
import { useAddresses } from '../../hooks/useAddresses';
import InstallationForm from '../installationForm/installationForm';
import { Correction, Installation, Removal, createInstallation } from '../../types/services';
import ServicesList from '../servicesOverview/servicesOverview';

export default function ServiceForm() {
    
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [requestType, setRequestType] = useState<"residential" | "commercial" | null>(null);

    const { addresses, selectedAddressId, removeServiceFromAddress, addServiceToAddress } = useAddresses();
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

    const [installationInitialData, setInstallationInitialData] = useState<Omit<Installation, 'type'> | undefined>();

    const [servicesData, setServicesData] = useState<{
        installation: Installation | null;
        removal: Removal | null;
        correction: Correction | null;
    }>({
        installation: null,
        removal: null,
        correction: null,
    });

    const [selectedServices, setSelectedServices] = useState({
        installation: false,
        removal: false,
        correction: false,
    });

    const handleServiceChange = (service: keyof typeof selectedServices) => {
        setSelectedServices(prev => ({
        ...prev,
        [service]: !prev[service]
        }));
    };

    const handleInstallationData = useCallback((data: Omit<Installation, 'type'>) => {
        // Validation simple : au moins un item sélectionné
        if (!Object.values(data.items).some(v => v)) {
            setError('Veuillez sélectionner au moins un élément');
            return;
        }

        setError('');
        setServicesData(prev => ({ ...prev, installation: data as Installation }));
    }, []);

    const handleSaveAllServices = () => {
        if (!selectedAddressId) {
            setError('Veuillez sélectionner une adresse');
            return;
        }

        if (selectedServices.installation && servicesData.installation) {
            const existingId = selectedAddress?.services.find(s => s.type === 'installation')?.id;
            if (existingId) {
                removeServiceFromAddress(selectedAddressId, existingId);
            }
            const service = createInstallation(servicesData.installation);
            addServiceToAddress(selectedAddressId, service);
            //setSelectedServices(prev => ({ ...prev, installation: false }));
            //setServicesData(prev => ({ ...prev, installation: null }));
        }

        if (selectedServices.removal && servicesData.removal) {
            //const service = createRemoval(servicesData.removal);
            //addServiceToAddress(selectedAddressId, service);
        }

        if (selectedServices.correction && servicesData.correction) {
            //const service = createCorrection(servicesData.correction);
            //addServiceToAddress(selectedAddressId, service);
        }

        // Reset
        //setSelectedServices({ installation: false, removal: false, correction: false });
        //setServicesData({ installation: null, removal: null, correction: null });
    };

    useEffect(() => {
        if (selectedAddress) {
            const existingInstallation = selectedAddress.services.find(s => s.type === 'installation');
            
            if (existingInstallation) {
                console.log('Installation trouvée, coche la checkbox');
                setSelectedServices(prev => ({ ...prev, installation: true }));
                setInstallationInitialData(existingInstallation);
            } else {
                console.log('Aucune installation, décoche la checkbox');
                setSelectedServices(prev => ({ ...prev, installation: false }));
                setInstallationInitialData(undefined);
            }
        }
    }, [selectedAddress]);

    return (
        <div className={styles.mainContainer}>
            <div className={styles.existingService}>
                <label>Vous aimeriez savoir letat ou modifier une demande de service existante ?</label>
                <AddressAutocomplete 
                    id="searchExistingService"
                    value={address} 
                    onChange={setAddress}
                />
            </div>

            <form className={styles.serviceForm}>
                <fieldset>
                    <legend>Faire une nouvelle demande de service</legend>
                    <div className={styles.userChoice}>
                        <label className={requestType === 'residential' ? styles.checked : ''}>
                            <input type="radio" id="residential" name="requestType" value="residential" checked={requestType === "residential"} onChange={() => setRequestType("residential")} /> 
                            Demande résidentielle
                        </label>
                        <label className={requestType === 'commercial' ? styles.checked : ''}>
                            <input type="radio" id="commercial" name="requestType" value="commercial" checked={requestType === "commercial"} onChange={() => setRequestType("commercial")}/>
                            Grand format
                        </label>
                    </div>
                </fieldset>

                <AddressManager />
                
                {selectedAddress && <fieldset>
                    <legend>De quels services avez vous besoin quon fasse a ladresse selectionner</legend>
                    
                    {selectedAddress && selectedAddress.type === 'address' && (
                    <span style={{color: 'black', fontWeight: '900'}}>{selectedAddress!.streetNumber} {selectedAddress!.streetName}</span>
                    )}

                    <div className={styles.userChoice}>
                        <label className={selectedServices.installation ? styles.checked : ''}>
                            <input 
                                type="checkbox" 
                                checked={selectedServices.installation}
                                onChange={() => handleServiceChange('installation')}
                            />
                            Installation
                        </label>

                        <label className={selectedServices.removal ? styles.checked : ''}>
                            <input 
                                type="checkbox" 
                                checked={selectedServices.removal}
                                onChange={() => handleServiceChange('removal')}
                            />
                            Retrait
                        </label>

                        <label className={selectedServices.correction ? styles.checked : ''}>
                            <input 
                                type="checkbox" 
                                checked={selectedServices.correction}
                                onChange={() => handleServiceChange('correction')}
                            />
                            Correction
                        </label>
                    </div>
                </fieldset>}

                {selectedServices.installation &&
                <InstallationForm 
                    onDataChange={handleInstallationData}
                    initialData={installationInitialData}
                />}

                {error && <p style={{ color: 'red' }}>{error}</p>}

                {Object.values(selectedServices).some(v => v) && (
                <button 
                    type="button" 
                    onClick={handleSaveAllServices}
                    className={styles.btnSave}
                >
                    Enregistrer les services
                </button>
                )}
            </form>

            <ServicesList 
                address={selectedAddress || null}
                onRemoveService={(serviceId) => removeServiceFromAddress(selectedAddressId!, serviceId)}
            />
        </div>
    );
}