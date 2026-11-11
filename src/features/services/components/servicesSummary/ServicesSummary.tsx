'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isLargeFormatService } from '@/features/services/utils/serviceRequestType';
import { LargeFormatSummary } from './largeFormat/LargeFormatSummary';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';
import { formatAddress } from '@/features/services/utils/formatAddress';

import { InstallationSummary } from './installation/InstallationSummary';
import { RemovalSummary } from './removal/RemovalSummary';
import { CorrectionSummary } from './correction/CorrectionSummary';
import { PickupSummary } from './pickup/PickupSummary';
import { DeliverySummary } from './delivery/DeliverySummary';

import styles from './servicesSummary.module.css';

interface ServicesSummaryProps {
  /** Adresses ayant au moins un service */
  addresses: Address[];
  onRemoveService: (addressId: string, serviceId: string) => void;
  onAddToCart: () => void;
  error: string | null;
}

export function ServicesSummary({ addresses, onRemoveService, onAddToCart, error }: ServicesSummaryProps) {
  const headingId = useId();
  const t = useTranslations('services');
  const addressLabels = { terrain: t('address.terrain'), near: t('address.near'), apartment: t('address.apartment') };

  return (
    <section aria-labelledby={headingId} className={styles.summary}>
      <h2 id={headingId} className={styles.title}>{t('summary.title')}</h2>

      {addresses.map((address) => (
        <article key={address.id} className={styles.address}>
          <header className={styles.header}>
            <h3 className={styles.addressName}>{formatAddress(address, addressLabels)}</h3>
            <span className={styles.badge}>{address.type === 'address' ? t('address.kindAddress') : t('address.kindTerrain')}</span>
          </header>

          <ul className={styles.services}>
            {address.services.map((service) => (
              <ServiceItem
                key={service.id}
                service={service}
                onRemove={() => onRemoveService(address.id, service.id)}
              />
            ))}
          </ul>
        </article>
      ))}

      {error && <p role="alert" className={styles.error}>{error}</p>}

      <button type="button" className={styles.addToCart} onClick={onAddToCart}>
        {t('summary.addToCart')}
      </button>
    </section>
  );
}

function ServiceItem({ service, onRemove }: { service: Service; onRemove: () => void }) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('services');
  const label = t(`serviceTypes.${service.type}`);

  const handleRemove = () => {
    // Même règle que décocher un service enregistré
    if (window.confirm(t('summary.confirmRemove', { service: label }))) onRemove();
  };

  return (
    <li className={styles.service}>
      <div className={styles.serviceRow}>
        <span className={styles.serviceName} data-type={service.type}>{label}</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('summary.lessDetails') : t('summary.moreDetails')}
            <span aria-hidden="true">{expanded ? '▲' : '▼'}</span>
          </button>
          <button type="button" className={styles.actionButton} onClick={handleRemove}>
            {t('summary.remove')}
          </button>
        </div>
      </div>

      <div id={detailsId} hidden={!expanded} className={styles.details}>
        {service.type === 'installation' && <InstallationSummary details={service} />}
        {service.type === 'removal' && <RemovalSummary details={service} />}
        {service.type === 'correction' && <CorrectionSummary details={service} />}
        {service.type === 'pickup' && <PickupSummary details={service} />}
        {service.type === 'delivery' && <DeliverySummary details={service} />}
        {isLargeFormatService(service) && <LargeFormatSummary service={service} />}
      </div>
    </li>
  );
}