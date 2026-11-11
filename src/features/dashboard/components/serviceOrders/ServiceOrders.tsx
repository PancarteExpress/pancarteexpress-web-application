'use client';

import { useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { OrderOwner, UserOrder } from '@/lib/orders/server/orders.service';
import { formatCents } from '@/lib/pricing/money';
import { getDisplayName } from '@/shared/utils/displayName';
import { formatServiceDate } from '@/lib/orders/serviceDelay';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { formatAddressNumber } from '@/lib/services/addressNumber';

import styles from './ServiceOrders.module.css';
import { ServiceDetailsSummary } from '@/features/services/components/servicesSummary/ServiceDetailsSummary';

interface Props {
  orders: (UserOrder & { user?: OrderOwner | null })[];
  title?: string;
  productsVisible?: boolean;
  toolbar?: ReactNode;
}

type ServiceAddressRow = UserOrder['serviceRequests'][number]['addresses'][number];
type OrderService = ServiceAddressRow['services'][number];

export default function ServiceOrders({ orders, title, productsVisible = true, toolbar }: Props) {
  const t = useTranslations('dashboard.serviceOrders');
  const tDashboard = useTranslations('dashboard');
  const locale = useAppLocale();

  const format = useFormatter();
  const formatDateTime = (date: Date) =>
    format.dateTime(date, { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Toronto' });

  const formatAddress = (a: ServiceAddressRow): string =>
    a.kind === 'civicAddress'
      ? `${a.streetNumber} ${a.streetName}${a.apartment ? t('apartment', { apartment: a.apartment }) : ''}, ${a.city}${a.postalCode ? ` ${a.postalCode}` : ''}`
      : `${a.city}${a.nearbyAddress ? t('near', { address: a.nearbyAddress }) : ''}`;

  // null = le SuperAdmin n'a pas encore fixé le prix
  const formatServicePrice = (price: OrderService['price']): string => price === null ? t('onQuote') : formatCents(price, locale);

  // null = grand format, sans délai
  const formatDelay = ({ delay, requestedDate }: ServiceAddressRow): string => {
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
                      {addresses.map((address) => (
                        <div key={address.id} className={styles.address}>
                          <p className={styles.addressLine}>
                            <span className={styles.addressNumber}>{formatAddressNumber(address.addressNumber)}</span>
                            <span className={styles.addressKind}>
                              {address.kind === 'civicAddress' ? t('residence') : t('terrain')}
                            </span>
                            <span className={styles.addressDetails}>{formatAddress(address)}</span>
                          </p>
                          {/* Délai propre à l'adresse */}
                          <p className={styles.delay}>{t('delay', { delay: formatDelay(address) })}</p>
                          {address.kind === 'terrain' && address.description && (
                            <p className={styles.terrainDescription}>{address.description}</p>
                          )}

                          {address.services.map((s) => (
                            <div key={s.id} className={styles.service}>
                              <p className={styles.serviceHeader}>
                                <strong>{t(`serviceTypes.${s.type}`)}</strong>
                                {' · '}{t(`statuses.${s.status}`)}
                                {s.status !== 'CANCELLED' && <>{' · '}{formatServicePrice(s.price)}</>}
                              </p>
                              {s.completedAt ? (
                                <p className={styles.serviceDate}>{t('completedAt', { date: formatDateTime(s.completedAt) })}</p>
                              ) : s.scheduledFor && (
                                <p className={styles.serviceDate}>{t('scheduledFor', { date: formatDateTime(s.scheduledFor) })}</p>
                              )}
                              <ServiceDetailsSummary type={s.type} details={s.details} />
                            </div>
                          ))}
                        </div>
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