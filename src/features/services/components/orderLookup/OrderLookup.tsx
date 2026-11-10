'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { LookupAddress, OrderLookupResult } from '@/lib/orders/server/orderLookup.service';
import { formatServiceDate, isoToUtcDate } from '@/lib/orders/serviceDelay';
import { formatAddressNumber } from '@/lib/services/addressNumber';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { Notice } from '@/features/services/components/fields/Notice';
import { TextField } from '@/features/services/components/fields/TextField';
import { ServiceDetailsSummary } from '../servicesSummary/ServiceDetailsSummary';
import summaryStyles from '../servicesSummary/servicesSummary.module.css';
import styles from './orderLookup.module.css';

/**
 * Recherche d'une demande par un visiteur non connecté : numéro d'adresse (PE-…) + courriel.
 * Le serveur ne renvoie le résumé que pour une commande sans compte ; sinon, il renvoie vers le tableau de bord.
 */
export function OrderLookup() {
  const headingId = useId();
  const t = useTranslations('services');
  const locale = useAppLocale();

  const [addressNumber, setAddressNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderLookupResult | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressNumber, email }),
      });
      if (res.status === 429) return setError(t('lookup.tooManyAttempts'));
      if (!res.ok) return setError(t('lookup.invalid'));
      const data: OrderLookupResult = await res.json();
      setResult(data);
    } catch {
      setError(t('lookup.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.lookup}>
      <h2 id={headingId} className={styles.title}>{t('lookup.title')}</h2>
      <p className={styles.intro}>{t('lookup.intro')}</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label={t('lookup.addressNumber')}
          value={addressNumber}
          // « PE-11191 » ou « 11191 » : le serveur valide
          onChange={(v) => setAddressNumber(v.toUpperCase())}
          required
        />
        <TextField label={t('lookup.email')} value={email} onChange={setEmail} required />
        <button type="submit" className={styles.submit} disabled={loading || !addressNumber || !email}>
          {loading ? t('lookup.searching') : t('lookup.submit')}
        </button>
      </form>

      <div aria-live="polite">
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {result?.status === 'notFound' && <p role="alert" className={styles.error}>{t('lookup.notFound')}</p>}
        {result?.status === 'member' && (
          <Notice>
            {t('lookup.member')}{' '}
            <Link href={`/${locale}/dashboard`} className={styles.link}>{t('lookup.toDashboard')}</Link>
          </Notice>
        )}
        {result?.status === 'found' && <LookupResult address={result.address} onClose={() => setResult(null)} />}
      </div>
    </section>
  );
}

/** Résumé en lecture seule d'une adresse : mêmes cartes que le résumé du formulaire, sans boutons */
function LookupResult({ address, onClose }: { address: LookupAddress; onClose: () => void }) {
  const t = useTranslations('services');
  const tCart = useTranslations('cart');
  const locale = useAppLocale();

  const formatAddress = (a: LookupAddress): string =>
    a.kind === 'civicAddress'
      ? `${a.streetNumber} ${a.streetName}${a.apartment ? `, ${t('address.apartment')} ${a.apartment}` : ''}, ${a.city}`
      : `${t('address.terrain')}, ${a.city}${a.nearbyAddress ? ` (${t('address.near')} ${a.nearbyAddress})` : ''}`;

  const delayText = ({ delay, requestedDate }: LookupAddress): string => {
    if (delay === null) return tCart('delay.none');
    if (delay === 'specificDate' && requestedDate) {
      return tCart('delay.specificDate', {
        date: formatServiceDate(isoToUtcDate(requestedDate), locale === 'en' ? 'en-CA' : 'fr-CA'),
      });
    }
    return tCart(`delay.${delay === 'specificDate' ? 'standard24h' : delay}`);
  };

  return (
    <div className={summaryStyles.summary}>
      <h3 className={summaryStyles.title}>
        {t('lookup.addressTitle', { number: formatAddressNumber(address.addressNumber) })}
      </h3>

      <p className={styles.delay}>
        {t(`requestTypes.${address.requestType}`)} · {delayText(address)}
      </p>

      <article className={summaryStyles.address}>
        <header className={summaryStyles.header}>
          <h4 className={summaryStyles.addressName}>{formatAddress(address)}</h4>
          <span className={summaryStyles.badge}>
            {address.kind === 'civicAddress' ? t('address.kindAddress') : t('address.kindTerrain')}
          </span>
        </header>
        {address.kind === 'terrain' && address.description && (
          <p className={summaryStyles.muted}>{address.description}</p>
        )}

        <ul className={summaryStyles.services}>
          {address.services.map((service) => (
            <li key={service.id} className={summaryStyles.service}>
              <div className={summaryStyles.serviceRow}>
                <span className={summaryStyles.serviceName} data-type={service.type}>
                  {t(`serviceTypes.${service.type}`)}
                </span>
              </div>
              <div className={summaryStyles.details}>
                <ServiceDetailsSummary type={service.type} details={service.details} />
              </div>
            </li>
          ))}
        </ul>
      </article>

      <button type="button" className={styles.closeButton} onClick={onClose}>
        {t('lookup.close')}
      </button>
    </div>
  );
}