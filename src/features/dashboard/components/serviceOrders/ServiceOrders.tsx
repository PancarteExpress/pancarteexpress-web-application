'use client';

import { useState, type ReactNode } from 'react';
import type { OrderOwner, UserOrder } from '@/lib/orders/server/orders.service';
import { formatCents } from '@/lib/pricing/money';
import { getDisplayName } from '@/shared/utils/displayName';
import { formatServiceDelay } from '@/lib/orders/serviceDelay';

import styles from './ServiceOrders.module.css';

interface Props {
  orders: (UserOrder & { user?: OrderOwner | null })[];
  title?: string;
  productsVisible?: boolean;
  toolbar?: ReactNode;
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];
type OrderService = ServiceAddressRow['services'][number];

const SERVICE_LABELS: Record<OrderService['type'], string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
  pickup: 'Ramassage',
  largeInstallation: 'Installation grand format',
  largeStoragePickup: 'Ramassage pour entreposage (grand format)',
  largeRetrieval: 'Récupération grand format',
};

// null = le SuperAdmin n'a pas encore fixé le prix
const formatServicePrice = (price: OrderService['price']): string => price === null ? 'sur soumission' : formatCents(price, 'fr');

export default function ServiceOrders({ orders, title = 'Demandes de service', productsVisible = true, toolbar }: Props) {
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

      {toolbar}

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
                      {getDisplayName(order.user)}
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
                  {order.products.length !== 0 && productsVisible && (
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
                      {order.serviceRequests.map((r) => (
                        <p key={r.id} className={styles.delay}>
                          Délai : {formatServiceDelay(r.delay, r.requestedDate)}
                        </p>
                      ))}
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