'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { LookupOrder, LookupServiceRequest, OrderLookupResult } from '@/lib/orders/server/orderLookup.service';
import { formatServiceDate, isoToUtcDate } from '@/lib/orders/serviceDelay';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { Notice } from '@/features/services/components/fields/Notice';
import { TextField } from '@/features/services/components/fields/TextField';
import { ServiceDetailsSummary } from '../servicesSummary/ServiceDetailsSummary';
import summaryStyles from '../servicesSummary/servicesSummary.module.css';
import styles from './orderLookup.module.css';

type Address = LookupServiceRequest['addresses'][number];

/**
 * Recherche d'une demande par un visiteur non connecté : numéro de commande + courriel.
 * Le serveur ne renvoie le résumé que pour une commande sans compte ; sinon, il renvoie vers le tableau de bord.
 */
export function OrderLookup() {
  const headingId = useId();
  const t = useTranslations('services');
  const locale = useAppLocale();

  const [orderNumber, setOrderNumber] = useState('');
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
        body: JSON.stringify({ orderNumber, email }),
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
          label={t('lookup.orderNumber')}
          value={orderNumber}
          // Chiffres seulement
          onChange={(v) => setOrderNumber(v.replace(/\D/g, ''))}
          inputMode="numeric"
          required
        />
        <TextField label={t('lookup.email')} value={email} onChange={setEmail} required />
        <button type="submit" className={styles.submit} disabled={loading || !orderNumber || !email}>
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
        {result?.status === 'found' && <LookupResult order={result.order} onClose={() => setResult(null)} />}
      </div>
    </section>
  );
}

/** Résumé en lecture seule : mêmes cartes que le résumé du formulaire, sans boutons */
function LookupResult({ order, onClose }: { order: LookupOrder; onClose: () => void }) {
  const t = useTranslations('services');
  const tCart = useTranslations('cart');
  const locale = useAppLocale();

  const formatAddress = (a: Address): string =>
    a.kind === 'civicAddress'
      ? `${a.streetNumber} ${a.streetName}${a.apartment ? `, ${t('address.apartment')} ${a.apartment}` : ''}, ${a.city}`
      : `${t('address.terrain')}, ${a.city}${a.nearbyAddress ? ` (${t('address.near')} ${a.nearbyAddress})` : ''}`;

  const delayText = (r: LookupServiceRequest): string => {
    if (r.delay === null) return tCart('delay.none');
    if (r.delay === 'specificDate' && r.requestedDate) {
      return tCart('delay.specificDate', {
        date: formatServiceDate(isoToUtcDate(r.requestedDate), locale === 'en' ? 'en-CA' : 'fr-CA'),
      });
    }
    return tCart(`delay.${r.delay === 'specificDate' ? 'standard24h' : r.delay}`);
  };

  return (
    <div className={summaryStyles.summary}>
      <h3 className={summaryStyles.title}>{t('lookup.orderTitle', { number: order.orderNumber })}</h3>

      {order.serviceRequests.length === 0 && <p className={summaryStyles.muted}>{t('lookup.noServices')}</p>}

      {order.serviceRequests.map((request) => (
        <div key={request.id} className={styles.request}>
          <p className={styles.delay}>
            {t(`requestTypes.${request.requestType}`)} · {delayText(request)}
          </p>

          {request.addresses.map((address) => (
            <article key={address.id} className={summaryStyles.address}>
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
          ))}
        </div>
      ))}

      <button type="button" className={styles.closeButton} onClick={onClose}>
        {t('lookup.close')}
      </button>
    </div>
  );
}
