'use client';

import { useState } from 'react';
import type { UserOrder } from '@/lib/orders/server/orders.service';
import { createServicesPaymentAction } from '@/lib/orders/server/servicesPayment.actions';
import { formatCents } from '@/lib/pricing/money';
import { PayServicesDialog, type ServicesPaymentReady } from '../payServicesDialog/PayServicesDialog';
import styles from './ServiceOrders.module.css';

interface Props {
  orders: UserOrder[];
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];
type OrderService = ServiceAddressRow['services'][number];

const SERVICE_LABELS: Record<OrderService['type'], string> = {
  installation: 'Installation',
  removal: 'Retrait',
  correction: 'Correction',
};

// null = le SuperAdmin n'a pas encore fixé le prix
const formatServicePrice = (price: OrderService['price']): string =>
  price === null ? 'sur soumission' : formatCents(price, 'fr');

/** Total des services à payer, et nombre de services encore sans prix (annulés exclus) */
function getServicesSummary(addresses: ServiceAddressRow[]) {
  const services = addresses.flatMap((a) => a.services).filter((s) => s.status !== 'CANCELLED');
  const priced = services.filter((s): s is OrderService & { price: number } => s.price !== null);

  return {
    total: priced.reduce((sum, s) => sum + s.price, 0),
    pendingCount: services.length - priced.length,
    hasServices: services.length > 0,
  };
}

export default function ServiceOrders({ orders }: Props) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<{ orderId: string; message: string } | null>(null);
  const [payment, setPayment] = useState<ServicesPaymentReady | null>(null);

  const toggleOrder = (id: string) => setOpenOrderId((prev) => (prev === id ? null : id));

  const handlePay = async (orderId: string) => {
    setPayError(null);
    setPreparingId(orderId);
    const result = await createServicesPaymentAction(orderId);
    setPreparingId(null);

    if (!result.ok) {
      setPayError({ orderId, message: result.error });
      return;
    }
    setPayment(result);
  };

  return (
    <div className={styles.mainContainer}>
      <h3 className={styles.title}>Demandes de service</h3>

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
          const summary = getServicesSummary(addresses);
          const isFullyPriced = summary.hasServices && summary.pendingCount === 0;
          const servicesPaid = order.payments.length > 0;

          return (
            <div key={order.id} className={styles.orders}>
              <div className={styles.resume}>
                <div className={styles.orderNumber}>
                  <label className={styles.orderNumber}>#{order.orderNumber}</label>
                </div>

                <div className={styles.status}>
                  <button type="button" onClick={() => toggleOrder(order.id)} aria-expanded={openOrderId === order.id}>
                    {openOrderId === order.id ? 'Fermer' : 'Détails'}
                  </button>

                  {order.status === 'CANCELLED' ? (
                    <label className={styles.canceled}>
                      <span className={styles.isNotPayed}>Annulé</span>
                    </label>
                  ) : !summary.hasServices ? (
                    order.status === 'PAID' && (
                      <label className={styles.billPayed}>
                        <span className={styles.isNotPayed}>Payé</span>
                      </label>
                    )
                  ) : servicesPaid ? (
                    <label className={styles.billPayed}>
                      <span className={styles.isNotPayed}>Services payés</span>
                    </label>
                  ) : isFullyPriced ? (
                    <button
                      type="button"
                      className={styles.billAvailable}
                      onClick={() => handlePay(order.id)}
                      disabled={preparingId !== null}
                    >
                      <span className={styles.isNotPayed}>
                        {preparingId === order.id
                          ? 'Préparation…'
                          : `Payer ${formatCents(summary.total, 'fr')} + taxes`}
                      </span>
                    </button>
                  ) : (
                    <button type="button" className={styles.billNotAvailable} disabled>
                      <span className={styles.isNotPayed}>En traitement</span>
                    </button>
                  )}
                </div>
              </div>

              {payError?.orderId === order.id && (
                <p className={styles.payError} role="alert">{payError.message}</p>
              )}

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

      {payment && <PayServicesDialog payment={payment} onClose={() => setPayment(null)} />}
    </div>
  );
}