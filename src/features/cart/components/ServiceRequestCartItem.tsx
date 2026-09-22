'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCents } from '@/lib/pricing/money';
import { calculateServicePrice, calculateServiceRequestPrice } from '@/lib/pricing/servicePricing';
import { formatAddress } from '@/features/services/utils/formatAddress';
import type { ServiceRequestCartItem as ServiceRequestCartItemType } from '../types/cart';
import styles from './ServiceRequestCartItem.module.css';

interface Props {
  item: ServiceRequestCartItemType;
  locale: 'fr' | 'en';
  onRemove: () => void;
}

export default function ServiceRequestCartItem({ item, locale, onRemove }: Props) {
  const t = useTranslations('cart');
  const [confirming, setConfirming] = useState(false);

  const addresses = item.addresses.filter((a) => a.services.length > 0);
  const labels = { terrain: t('terrain'), near: t('near'), apartment: t('apartment') };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span className={styles.badge}>{t(`requestType.${item.requestType}`)}</span>
        <span className={styles.total}>{formatCents(calculateServiceRequestPrice(addresses), locale)}</span>
      </header>

      <ul className={styles.addresses}>
        {addresses.map((address) => (
          <li key={address.id}>
            <p className={styles.address}>{formatAddress(address, labels)}</p>
            <ul className={styles.services}>
              {address.services.map((service) => (
                <li key={service.id} className={styles.service}>
                  <span>{t(`serviceTypes.${service.type}`)}</span>
                  <span>{formatCents(calculateServicePrice(service), locale)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <footer className={styles.actions}>
        {confirming ? (
          <>
            <span role="alert" className={styles.confirmText}>{t('confirmRemoveQuestion')}</span>
            <button type="button" className={styles.buttonSecondary} onClick={() => setConfirming(false)}>
              {t('cancel')}
            </button>
            <button type="button" className={styles.buttonDanger} onClick={onRemove} autoFocus>
              {t('confirmRemove')}
            </button>
          </>
        ) : (
          <button type="button" className={styles.buttonSecondary} onClick={() => setConfirming(true)}>
            {t('remove')}
          </button>
        )}
      </footer>
    </article>
  );
}