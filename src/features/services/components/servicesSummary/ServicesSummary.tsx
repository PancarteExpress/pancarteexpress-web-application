'use client';

import { useId, useState } from 'react';
import { SERVICE_LABELS } from '@/features/services/constants/installation';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';
import { formatAddress } from '@/features/services/utils/formatAddress';
import { ADDRESS_LABELS } from '@/features/services/constants/installation';
import { InstallationSummary } from './installation/installationSummary';
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

  return (
    <section aria-labelledby={headingId} className={styles.summary}>
      <h2 id={headingId} className={styles.title}>Résumé de la demande</h2>

      {addresses.map((address) => (
        <article key={address.id} className={styles.address}>
          <header className={styles.header}>
            <h3 className={styles.addressName}>{formatAddress(address, ADDRESS_LABELS)}</h3>
            <span className={styles.badge}>{address.type === 'address' ? 'Adresse' : 'Terrain'}</span>
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
        Ajouter au panier
      </button>
    </section>
  );
}

function ServiceItem({ service, onRemove }: { service: Service; onRemove: () => void }) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);

  const handleRemove = () => {
    // Même règle que décocher un service enregistré
    if (window.confirm(`Supprimer le service « ${SERVICE_LABELS[service.type]} » ?`)) onRemove();
  };

  return (
    <li className={styles.service}>
      <div className={styles.serviceRow}>
        <span className={styles.serviceName} data-type={service.type}>{SERVICE_LABELS[service.type]}</span>
        <div className={styles.actions}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Moins de détails' : 'Plus de détails'}
          </button>
          <button type="button" onClick={handleRemove}>Supprimer</button>
        </div>
      </div>

      <div id={detailsId} hidden={!expanded} className={styles.details}>
        {service.type === 'installation' && <InstallationSummary details={service} />}
      </div>
    </li>
  );
}