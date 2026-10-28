'use client';

import { useState } from 'react';
import type { OrderOwner, UserOrder } from '@/lib/orders/server/orders.service';
import { formatCents } from '@/lib/pricing/money';

import styles from './ServiceOrders.module.css';

interface Props {
  orders: (UserOrder & { user?: OrderOwner | null })[];
  title?: string;
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];
type OrderService = ServiceAddressRow['services'][number];

const SERVICE_LABELS: Record<OrderService['type'], string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
};

// null = le SuperAdmin n'a pas encore fixé le prix
const formatServicePrice = (price: OrderService['price']): string => price === null ? 'sur soumission' : formatCents(price, 'fr');

export default function ServiceOrders({ orders, title = 'Demandes de service' }: Props) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const toggleOrder = (id: string) => setOpenOrderId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.mainContainer}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.header}>
        <div>
          <span>Commande</span>
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
                  {order.user && (
                    <span className={styles.orderOwner}>
                      {[order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email}
                    </span>
                  )}
                </div>

                <div className={styles.status}>
                  <button type="button" onClick={() => toggleOrder(order.id)} aria-expanded={openOrderId === order.id}>
                    {openOrderId === order.id ? 'Fermer' : 'Détails'}
                  </button>
                </div>
              </div>

              {openOrderId === order.id && (
                <div className={styles.details}>
                  {order.products.length !== 0 && (
                    <div className={styles.products}>
                      <h3>Produits :</h3>
                      {order.products.map((product) => (
                        <label key={product.id}>
                          {product.productName} ×{product.quantity}
                        </label>
                      ))}
                    </div>
                  )}

                  {addresses.length !== 0 && (
                    <div className={styles.services}>
                      <h3>Services :</h3>
                      {addresses.map((address) => (
                        <label key={address.id}>
                          <span className={styles.addressKind}>
                            {address.kind === 'civicAddress' && 'Résidence'}
                            {address.kind === 'terrain' && 'Terrain'}
                          </span>

                          <span className={styles.addressDetails}>
                            {address.kind === 'civicAddress' &&
                              `${address.streetNumber} ${address.streetName}${address.apartment ? `, app. ${address.apartment}` : ''}, ${address.city}`}
                            {address.kind === 'terrain' &&
                              `${address.city}${address.nearbyAddress ? `, près de ${address.nearbyAddress}` : ''}`}
                          </span>

                          <span className={styles.selectedServices}>
                            - {address.services
                              .map((s) => `${SERVICE_LABELS[s.type]} (${s.status === 'CANCELLED' ? 'annulé' : formatServicePrice(s.price)})`)
                              .join(', ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}