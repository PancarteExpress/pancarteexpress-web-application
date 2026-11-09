import { useTranslations } from 'next-intl';
import type { BlockSource } from '@/lib/orders/billing';
import styles from './ServiceBlock.module.css';
import { CONTACT, telHref } from '@/shared/constants/contact';

export function ServicesBlocked({ source }: { source: BlockSource }) {
  const t = useTranslations('services.serviceBlock');
  return (
    <section className={styles.blocked} aria-labelledby="services-blocked-title">
      <span className={styles.blockedIcon} aria-hidden="true">⛔</span>
      <h1 id="services-blocked-title" className={styles.blockedTitle}>
        {t('blockedTitle')}
      </h1>
      <p className={styles.blockedText}>{t(`blocked.${source}`)}</p>
      <p className={styles.blockedNote}>{t('shopStillOpen')}</p>
      <a href={telHref(CONTACT.mainPhone)} className={styles.phone}>
        📞 {CONTACT.mainPhone}
      </a>
    </section>
  );
}