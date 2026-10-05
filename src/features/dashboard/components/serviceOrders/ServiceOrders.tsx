'use client';

import type { UserServiceOrder } from '@/lib/orders/server/orders.service';
import styles from './ServiceOrders.module.css';

interface Props {
  orders: UserServiceOrder[];
}

type DisplayState = 'pending' | 'done' | 'canceled';
type ServiceAddressRow = UserServiceOrder['serviceRequests'][number]['addresses'][number];
const SERVICE_LABELS: Record<ServiceAddressRow['services'][number]['type'], string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
};

const STATE_DISPLAY: Record<DisplayState, { label: string; className: string }> = {
  pending: { label: 'En traitement', className: styles.pending },
  canceled: { label: 'Annulée', className: styles.canceled },
  done: { label: 'Complétée', className: styles.done },
};

function getAddressLabel(address: ServiceAddressRow): string {
  if (address.kind === 'civicAddress') {
    const apt = address.apartment ? `, app. ${address.apartment}` : '';
    return `${address.streetNumber ?? ''} ${address.streetName ?? ''}${apt}, ${address.city}`.trim();
  }

  // Terrain : description + repère éventuel
  const near = address.nearbyAddress ? ` (près du ${address.nearbyAddress})` : '';
  return `Terrain : ${address.description ?? ''}, ${address.city}${near}`;
}

export default function ServiceOrders({ orders }: Props) {
  return (
    <div className={styles.services}>
      <h3 className={styles.title}>Demandes de service</h3>

      <div className={styles.header}>
        <div>
          <span>Commande</span>
        </div>
        <div>
          <span>Détails</span>
          <span>État</span>
          <span>Payment</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <p>Aucune demande de service</p>
      ) : (
        orders.map((order) => {
          const state = order.status;
          const addresses = order.serviceRequests.flatMap((r) => r.addresses);

          return (
            <div key={order.id} className={styles.orders}>
              
              <div className={styles.resume}>
                <div className={styles.orderNumber}>
                  <label className={styles.orderNumber}>#{order.orderNumber}</label>
                </div>

                <div className={styles.status}>
                  
                  <button>Voir</button>

                  {state as string === 'PENDING' && 
                  <label className={styles.billNotAvailable}>
                    <span className={styles.isNotPayed}>99.99$</span>
                  </label>}
                  
                  {state as string === 'PAID' && 
                  <label className={styles.billPayed}>
                    <span className={styles.isNotPayed}>Payé</span>
                  </label>}
                  
                  {state as string === 'CANCELLED' && 
                  <label className={styles.canceled}>
                    <span className={styles.isNotPayed}>Annulé</span>
                  </label>}
                
                </div>
              </div>
              
              <div className={styles.details}>
                {addresses.map((address) => (
                  <div key={address.id} className={styles.orderAddr}>
                    <label>
                      {getAddressLabel(address)}  · {address.services.map((s) => SERVICE_LABELS[s.type]).join(', ')}
                    </label>
                  </div>
                ))}
              </div>
              
              {/*<div>
                <span className={styles.orderNum}>#{order.orderNumber}</span>
                <div className={styles.addressList}>
                {addresses.map((address) => (
                  <div key={address.id} className={styles.orderAddr}>
                    <label>
                      {getAddressLabel(address)}  · {address.services.map((s) => SERVICE_LABELS[s.type]).join(', ')}
                    </label>
                  </div>
                ))}
                </div>
              </div>

              <div>
                <h1>
                  <span className={styles.seeDetails}>Voir</span>
                </h1>

                <h1>
                  {state === 'pending' && <span className={styles.pending}>En traitement</span>}
                  {state === 'canceled' && <span className={styles.canceled}>Annulée</span>}
                  {state === 'done' && <span className={styles.done}>Complétée</span>}
                </h1>

                <h1>{state !== 'canceled' && <span className={styles.isNotPayed}>Sur soumission</span>}</h1>
              </div>*/}
            </div>
          );
        })
      )}
    </div>
  );
}