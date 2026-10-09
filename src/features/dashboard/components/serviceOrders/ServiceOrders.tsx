'use client';

import type { UserOrder } from '@/lib/orders/server/orders.service';
import styles from './ServiceOrders.module.css';
import { useState } from 'react';

interface Props {
  orders: UserOrder[];
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];

const SERVICE_LABELS: Record<ServiceAddressRow['services'][number]['type'], string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
};

export default function ServiceOrders({ orders }: Props) {

  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const toggleOrder = (id: string) => setOpenOrderId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.mainContainer}>
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
        <div className={styles.noOrders}>
          <p>Aucune demande de service</p>
        </div>
      ) : (
        orders.map((order) => {
          const addresses = order.serviceRequests.flatMap((r) => r.addresses);

          return (
            <div key={order.id} className={styles.orders}>
              
              <div className={styles.resume}>
                <div className={styles.orderNumber}>
                  <label className={styles.orderNumber}>#{order.orderNumber}</label>
                </div>

                <div className={styles.status}>
                  
                  <button type="button" onClick={() => toggleOrder(order.id)} aria-expanded={openOrderId === order.id}>
                    {openOrderId === order.id ? 'Fermer' : 'Details'}
                  </button>

                  {order.status === 'PENDING' && 
                  <button className={styles.billNotAvailable}>
                    <span className={styles.isNotPayed}>En traitement</span>
                  </button>}
                  
                  {order.status === 'PAID' && 
                  <label className={styles.billPayed}>
                    <span className={styles.isNotPayed}>Payé</span>
                  </label>}
                  
                  {order.status === 'CANCELLED' && 
                  <label className={styles.canceled}>
                    <span className={styles.isNotPayed}>Annulé</span>
                  </label>}
                
                </div>
              </div>
              
              {openOrderId === order.id &&
              <div className={styles.details}>
                {/* NOUVEAU : produits de la commande */}
                {order.products.length !== 0 &&
                <div className={styles.products}>
                  <h3>Produits :</h3>

                  {order.products.map((product) => (
                  <label key={product.id}>
                    {product.productName} ×{product.quantity}
                  </label>
                  ))}

                </div>}

                {/* Services : une ligne par adresse */}
                {addresses.length !== 0 &&
                <div className={styles.services}>
                  <h3>Services :</h3>
                  {addresses.map((address) => (
                  <label key={address.id}>
                    
                    <span className={styles.addressKind}> 
                      {address.kind === 'civicAddress' && 'Résidence'}
                      {address.kind === 'terrain' && 'Terrain'} 
                    </span>

                    <span className={styles.addressDetails}>
                      {address.kind === 'civicAddress' && `${address.streetNumber} ${address.streetName}${address.apartment ? `, app. ${address.apartment}` : ''}, ${address.city}`}
                      {address.kind === 'terrain' && `${address.city} ${address.nearbyAddress ? `, near. ${address.nearbyAddress}` : ''}`}
                    </span>

                    <span className={styles.selectedServices}>
                      - {address.services.map((s) => SERVICE_LABELS[s.type]).join(', ')}
                    </span>
                  </label>
                  ))}
                </div>}
              </div>
              }
            </div>
          );
        })
      )}
    </div>
  );
}