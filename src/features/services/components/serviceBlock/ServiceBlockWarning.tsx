'use client';

import { useTranslations } from 'next-intl';
import type { BlockSource } from '@/lib/orders/billing';
import styles from './ServiceBlock.module.css';
import { formatDate } from '@/shared/utils/date';
import { useAppLocale } from '@/shared/hooks/useAppLocale';

// Une clé par blocage : un nouveau blocage réaffiche l'avertissement
const storageKey = (startsAt: string) => `serviceBlockWarning:${startsAt}`;

function wasAcknowledged(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false; // stockage indisponible (navigation privée) : on affiche l'avertissement
  }
}

interface ServiceBlockWarningProps {
  startsAt: string; // ISO
  daysLeft: number;
  source: BlockSource;
}

export function ServiceBlockWarning({ startsAt, daysLeft, source }: ServiceBlockWarningProps) {
  const key = storageKey(startsAt);
  const t = useTranslations('services.serviceBlock');
  const locale = useAppLocale();

  // Ouverture au montage, sans useEffect ; une seule fois par session de navigation
  const openIfNeeded = (node: HTMLDialogElement | null) => {
    if (node && !node.open && !wasAcknowledged(key)) node.showModal();
  };

  // Appelé pour OK comme pour Échap
  const handleClose = () => {
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      // stockage indisponible : l'avertissement réapparaîtra à la prochaine visite
    }
  };

  const delay = t('delay', { days: daysLeft, date: formatDate(new Date(startsAt), 'long', locale) });

  return (
    <dialog
      ref={openIfNeeded}
      className={styles.dialog}
      aria-labelledby="service-block-warning-title"
      onClose={handleClose}
    >
      <form method="dialog">
        <h2 id="service-block-warning-title" className={styles.dialogTitle}>
          <span aria-hidden="true">⚠️</span> {t('warningTitle')}
        </h2>
        <p className={styles.dialogText}>{t(`warning.${source}`, { delay })}</p>
        <div className={styles.dialogActions}>
          <button type="submit" className={styles.btnPrimary} autoFocus>
            {t('ok')}
          </button>
        </div>
      </form>
    </dialog>
  );
}