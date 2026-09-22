'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatCents } from '@/lib/pricing/money';
import type { Totals } from '@/lib/pricing/calculateTotals';
import styles from './CartSummary.module.css';

interface Props {
  estimate: Totals;
  hasProducts: boolean;
  hasServices: boolean;
  locale: 'fr' | 'en';
}

export default function CartSummary({ estimate, hasProducts, hasServices, locale }: Props) {
  const t = useTranslations('cart');
  const fmt = (cents: number) => formatCents(cents, locale);

  return (
    <aside className={styles.summary} aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className={styles.title}>{t('summaryTitle')}</h2>

      <dl className={styles.rows}>
        {hasProducts && (
          <div className={styles.row}><dt>{t('productsSubtotal')}</dt><dd>{fmt(estimate.productsSubtotal)}</dd></div>
        )}
        {hasServices && (
          <div className={styles.row}><dt>{t('servicesSubtotal')}</dt><dd>{fmt(estimate.servicesSubtotal)}</dd></div>
        )}
        <div className={`${styles.row} ${styles.separator}`}><dt>{t('subtotal')}</dt><dd>{fmt(estimate.subtotal)}</dd></div>
        <div className={styles.row}><dt>{t('tps')}</dt><dd>{fmt(estimate.tps)}</dd></div>
        <div className={styles.row}><dt>{t('tvq')}</dt><dd>{fmt(estimate.tvq)}</dd></div>
        <div className={`${styles.row} ${styles.totalRow}`}>
          <dt>{t('total')}</dt>
          <dd aria-live="polite">{fmt(estimate.total)}</dd>
        </div>
      </dl>

      <p className={styles.note}>
        {t('estimateNote')}
        {hasProducts && ` ${t('shippingAtCheckout')}`}
      </p>

      <Link href={`/${locale}/checkout`} className={styles.checkout}>
        {t('checkout')}
      </Link>
    </aside>
  );
}