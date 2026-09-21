'use client';


import { Address } from '../../types/address';
import styles from './servicesOverview.module.css';

interface Props {
  address: Address | null;
  onRemoveService?: (serviceId: string) => void;
}

export default function ServicesList({ address, onRemoveService }: Props) {
  if (!address) return null;

  if (address.services.length === 0) {
    return <p>Aucun service enregistré pour cette adresse</p>;
  }

  return (
    <div className={styles.mainContainer}>

      <div className={styles.header}>
        <label>
          {address.type === 'address' && `${address.streetNumber} ${address.streetName}, ${address.city}`}
        </label>

        <label>
          {address.type === 'address' ? 'address' : 'terrain'}
        </label>
      </div>

      {address.services.map( (service) => (
      <div key={service.id}>
        <div className={styles.orderResume}>
          
          <label >
            <span style={{backgroundColor: service.type === 'installation' ? '#1B5E20' : '#0E4D9A'}}></span>{service.type}
          </label>
          

          <button type='button'>Plus de details</button>
        </div>

        <div className={styles.accessibility}>
          {service.type === 'installation' && service.accessibility && <label>{service.accessibility} {service.specialAccess}</label>}
        </div>
        
        <div className={styles.materialsDetail}>
          {service.type === 'installation' && Object.entries(service.items).map(([key, item]) => (
            item.selected && (
              <div key={key} className={styles.details}>
                <div className={styles.material}>
                  <label>{key}</label>
                  <label>{`${item.details?.quantity}`} unité(s)</label>
                </div>
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </div>
            )
          ))}
        </div>
      </div>))}

      que veux on installer :

      {address.services.map((service) => (
        <div  key={service.id}>
          <div className={styles.serviceInfo}>
            {service.type === 'installation' && (
              <div>
                <pre>{JSON.stringify(service.items.frames.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.anchors.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.poles.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.addonsOpenHouse.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.addons.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.keybox.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.flags.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.directional.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.items.other.details, null, 2)}</pre>
                <pre>{JSON.stringify(service.accessibility, null, 2)}</pre>
                <pre>{JSON.stringify(service.specialAccess, null, 2)}</pre>
              </div>
            )}
          </div>
          <button 
            className={styles.deleteBtn}
            onClick={() => onRemoveService?.(service.id)}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}