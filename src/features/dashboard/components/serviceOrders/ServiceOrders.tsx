'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { OrderOwner, UserOrder } from '@/lib/orders/server/orders.service';
import { formatCents } from '@/lib/pricing/money';
import { getDisplayName } from '@/shared/utils/displayName';
import { formatServiceDate } from '@/lib/orders/serviceDelay';
import { useAppLocale } from '@/shared/hooks/useAppLocale';

import styles from './ServiceOrders.module.css';

interface Props {
  orders: (UserOrder & { user?: OrderOwner | null })[];
  title?: string;
  productsVisible?: boolean;
  toolbar?: ReactNode;
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];
type OrderService = ServiceAddressRow['services'][number];
type ServiceRequestRow = UserOrder['serviceRequests'][number];

export default function ServiceOrders({ orders, title, productsVisible = true, toolbar }: Props) {
  const t = useTranslations('dashboard.serviceOrders');
  const tDashboard = useTranslations('dashboard');
  const locale = useAppLocale();

  // null = le SuperAdmin n'a pas encore fixé le prix
  const formatServicePrice = (price: OrderService['price']): string => price === null ? t('onQuote') : formatCents(price, locale);

  // null = grand format, sans délai
  const formatDelay = ({ delay, requestedDate }: ServiceRequestRow): string => {
    if (delay === null) return t('delays.none');
    return delay === 'specificDate' && requestedDate
      ? t('delays.specificDate', { date: formatServiceDate(requestedDate, `${locale}-CA`) })
      : t(`delays.${delay}`);
  };

  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const toggleOrder = (id: string) => setOpenOrderId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.mainContainer}>
      <h3 className={styles.title}>{title ?? tDashboard('serviceRequests')}</h3>

      <div className={styles.header}>
        <div>
          <span>{t('order')}</span>
        </div>
      </div>

      {toolbar}

      {orders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>{t('noOrders')}</p>
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
                    {openOrderId === order.id ? t('close') : t('details')}
                  </button>
                </div>
              </div>

              {openOrderId === order.id && (
                <div className={styles.details}>
                  {order.products.length !== 0 && productsVisible && (
                    <div className={styles.products}>
                      <h3>{t('products')}</h3>
                      {order.products.map((product) => (
                        <label key={product.id}>
                          {product.productName} ×{product.quantity}
                        </label>
                      ))}
                    </div>
                  )}

                  {addresses.length !== 0 && (
                    <div className={styles.services}>
                      <h3>{t('services')}</h3>
                      {order.serviceRequests.map((r) => (
                        <p key={r.id} className={styles.delay}>
                          {t('delay', { delay: formatDelay(r) })}
                        </p>
                      ))}
                      {addresses.map((address) => (
                        <label key={address.id}>
                          <span className={styles.addressKind}>
                            {address.kind === 'civicAddress' && t('residence')}
                            {address.kind === 'terrain' && t('terrain')}
                          </span>

                          <span className={styles.addressDetails}>
                            {address.kind === 'civicAddress' &&
                              `${address.streetNumber} ${address.streetName}${address.apartment ? t('apartment', { apartment: address.apartment }) : ''}, ${address.city}`}
                            {address.kind === 'terrain' &&
                              `${address.city}${address.nearbyAddress ? t('near', { address: address.nearbyAddress }) : ''}`}
                          </span>

                          <span className={styles.selectedServices}>
                            - {address.services
                              .map((s) => `${t(`serviceTypes.${s.type}`)} (${s.status === 'CANCELLED' ? t('cancelled') : formatServicePrice(s.price)})`)
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