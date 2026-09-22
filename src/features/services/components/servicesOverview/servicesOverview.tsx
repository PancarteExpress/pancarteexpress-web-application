'use client';

import { useState } from 'react';
import { Address } from '../../types/address';
import styles from './servicesOverview.module.css';

interface Props {
  addresses: Address[];
  onRemoveService?: (addressId: string, serviceId: string) => void;
  onAddToCart: () => void;
}

export default function ServicesList({ addresses, onRemoveService, onAddToCart }: Props) {
  const [showDetails, setShowDetails] = useState<string | null>(null);  // ← Track par serviceId
  
  // Filtre les adresses qui ont au moins un service
  const addressesWithServices = addresses.filter(addr => addr.services?.length > 0);

  if (addressesWithServices.length === 0) {
    return <p>Aucun service enregistré</p>;
  }

  return (
    <>
    {addressesWithServices.map((address) => (
    <div key={address.id} className={styles.mainContainer}>
      
        <div>
          <div className={styles.header}>
            <label>
              {address.type === 'address' && `${address.streetNumber} ${address.streetName}, ${address.city}`}
              {address.type === 'terrain' && `${address.city} ${address.nearbyAddress}`}
            </label>
            <label>
              {address.type === 'address' ? 'address' : 'terrain'}
            </label>
          </div>

          {address.services.map((service) => (
            <div key={service.id}>
              <div className={styles.orderResume}>
                <label>
                  <span style={{backgroundColor: service.type === 'installation' ? '#1B5E20' : '#0E4D9A'}}></span>
                  {service.type}
                </label>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type='button' onClick={() => onRemoveService?.(address.id, service.id)}>
                    Supprimer le service
                  </button>

                  <button type='button' onClick={() => setShowDetails(showDetails === service.id ? null : service.id)}>
                    {showDetails === service.id ? 'Moins de details' : 'Plus de details'}
                  </button>
                </div>
              </div>

              <div className={styles.accessibility}>
                {service.type === 'installation' && service.accessibility && <label>{service.accessibility} {service.specialAccess}</label>}
              </div>
              
              {showDetails === service.id && service.type === 'installation' && Object.entries(service.items)
                .filter(([key, item]) => {
                  if (!item.selected) return false;
                  const hasFrames = service.items.frames?.selected;
                  if (hasFrames && (key === 'anchors' || key === 'poles')) {
                    return false;
                  }
                  return true;
                })
                .map(([key, item]) => (item.selected && (
                  <div key={key} className={styles.serviceDetails}>
                    <div className={styles.details}>
                      <div className={styles.material}>
                        <label>{key}</label>
                        <label>{`${item.details?.quantity}`} unité(s)</label>
                      </div>
                      
                      {key !== 'frames' &&
                      <div className={styles.section}>
                        <label className={styles.title}>Location</label>
                        <label>{(item.details?.toRent as boolean) ? 'Oui' : 'Non'}</label>
                      </div>}
                      
                      <div className={styles.section}>
                        <label className={styles.title}>Ramassage du materiel a une autre adresse</label>
                        <label>{(item.details?.pickup as boolean) ? `${item.details?.pickupAddress}` : 'Non'}</label>
                      </div>
                      
                      {key === 'keybox' && 
                      <div className={styles.section}>
                        <label className={styles.title}>Mot de passe pour les boites a cles</label>
                        <label>{item.details?.password as string}</label>
                      </div>}

                      {Array.from({ length: Number(item.details?.quantity) || 1 }).map((_, i) => (
                        <div key={`material-${i}`} className={styles.detailsPerMaterial}>
                          <h4>{key} {i + 1}:</h4>
                          
                          {(item.details?.rentAddons as boolean[])?.[i] && <>
                            <p><strong>Location ajouts:</strong></p>
                            {Object.entries((item.details?.addons as Record<string, unknown>[])?.[i] || {})
                              .filter(([, value]) => value === true || (typeof value === 'string' && value) || (typeof value === 'object' && value !== null))
                              .map(([addonKey, addonValue]) => (
                                <label key={addonKey}>
                                  <span>
                                    {addonKey === 'openHouse' 
                                      ? `Visite libre: ${(addonValue as {selectedDate: string; startTime: string; endTime: string}).selectedDate} ${(addonValue as {selectedDate: string; startTime: string; endTime: string}).startTime}-${(addonValue as {selectedDate: string; startTime: string; endTime: string}).endTime}`
                                      : addonValue === true 
                                        ? addonKey 
                                        : `${addonKey}: ${addonValue}`
                                    }
                                  </span>
                                  <br />
                                </label>
                              ))
                            }
                          </>}

                          {(item.details?.openHouse as boolean) && (
                            <p>
                              <strong>Visite libre:</strong> {(item.details?.openHouse as {selectedDate: string; startTime: string; endTime: string}).selectedDate} {(item.details?.openHouse as {selectedDate: string; startTime: string; endTime: string}).startTime}-{(item.details?.openHouse as {selectedDate: string; startTime: string; endTime: string}).endTime}
                            </p>
                          )}
                          
                          <p>
                            <strong>Emplacement:</strong>
                            <br />
                            {(item.details?.placements as Array<{placement: string}>)?.[i]?.placement}
                          </p>
                          
                          {Array.isArray(item.details?.addons) && item.details.addons[i]?.placement && (
                            <p>
                              <strong>Placement:</strong> {item.details.addons[i].placement}
                            </p>
                          )}

                          <p>
                            <strong>Addons:</strong>
                            {Object.entries((item.details?.addons as Record<string, unknown>[])?.[i] || {})
                              .filter(([addonKey, value]) => addonKey !== 'placement' && (value === true || (typeof value === 'string' && value)))
                              .map(([addonKey, addonValue]) => (
                                <span key={addonKey}>
                                  {addonValue === true ? addonKey : `${addonKey}: ${addonValue}`}
                                  {', '}
                                </span>
                              ))
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )))}
            </div>
          ))}
        </div>
      
    </div>
    ))}

    <div className={styles.addToCart}>
      <button type="button" onClick={onAddToCart} className={styles.btnAddToCart}>
        Ajouter au panier
      </button>
    </div>
    </>
  );
}