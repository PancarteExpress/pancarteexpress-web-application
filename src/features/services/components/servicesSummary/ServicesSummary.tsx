'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isLargeFormatService } from '@/features/services/utils/serviceRequestType';
import { LargeFormatSummary } from './largeFormat/LargeFormatSummary';
import type { Address } from '@/features/services/types/address';
import type { Service } from '@/features/services/types/services';
import type { ServiceKey } from '@/features/services/store/addressStore';
import { useDelayText } from '@/features/cart/hooks/useDelayText';
import type { ServiceSchedule } from '@/features/services/types/schedule';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
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
  /** Services en cours de saisie et incomplets, par adresse */
  incomplete: Record<string, ServiceKey[]>;
  /** Résidentiel : affiche le délai de chaque adresse */
  showSchedule: boolean;
  onRemoveService: (addressId: string, serviceId: string) => void;
  /** Supprime un service jamais complété (il n'existe qu'en brouillon) */
  onRemoveDraft: (addressId: string, type: ServiceKey) => void;
  onAddToCart: () => void;
  error: string | null;
}

export function ServicesSummary({
  addresses, incomplete, showSchedule, onRemoveService, onRemoveDraft, onAddToCart, error,
}: ServicesSummaryProps) {
  const delayText = useDelayText(useAppLocale());
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
          {showSchedule && <AddressDelay address={address} delayText={delayText} />}

          <ul className={styles.services}>
            {address.services.map((service) => (
              <ServiceItem
                key={service.id}
                service={service}
                incomplete={incomplete[address.id]?.includes(service.type) ?? false}
                onRemove={() => onRemoveService(address.id, service.id)}
              />
            ))}
            {/* Services cochés mais jamais complétés : pas encore de détails à montrer */}
            {(incomplete[address.id] ?? [])
              .filter((type) => !address.services.some((s) => s.type === type))
              .map((type) => (
                <PendingItem key={type} type={type} onRemove={() => onRemoveDraft(address.id, type)} />
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

function ServiceItem({ service, incomplete, onRemove }: { service: Service; incomplete: boolean; onRemove: () => void }) {
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
        <span className={styles.serviceName} data-type={service.type}>
          {label}
          {incomplete && <IncompletePill />}
        </span>
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

/** La saisie en cours est incomplète : le résumé montre la dernière version complète */
function IncompletePill() {
  const t = useTranslations('services');
  return <span className={styles.incompletePill}>{t('summary.incomplete')}</span>;
}

/** Service coché mais jamais complété : seulement son nom, la pastille et la suppression */
function PendingItem({ type, onRemove }: { type: ServiceKey; onRemove: () => void }) {
  const t = useTranslations('services');
  const label = t(`serviceTypes.${type}`);

  const handleRemove = () => {
    if (window.confirm(t('summary.confirmRemove', { service: label }))) onRemove();
  };

  return (
    <li className={styles.service}>
      <div className={styles.serviceRow}>
        <span className={styles.serviceName} data-type={type}>
          {label}
          <IncompletePill />
        </span>
        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} onClick={handleRemove}>
            {t('summary.remove')}
          </button>
        </div>
      </div>
    </li>
  );
}

/** Délai saisi pour l'adresse ; null si la date précise n'est pas encore choisie */
function toSchedule(draft: Address['scheduleDraft']): ServiceSchedule | null {
  const delay = draft?.delay ?? 'standard24h';
  if (delay !== 'specificDate') return { delay };
  return draft?.date ? { delay, date: draft.date } : null;
}

function AddressDelay({ address, delayText }: { address: Address; delayText: ReturnType<typeof useDelayText> }) {
  const t = useTranslations('services');
  const schedule = toSchedule(address.scheduleDraft);

  return (
    <p className={styles.addressDelay}>
      {schedule ? delayText(schedule) : (
        <>
          {t('summary.dateToSpecify')}
          <span className={styles.incompletePill}>{t('summary.incomplete')}</span>
        </>
      )}
    </p>
  );
}
