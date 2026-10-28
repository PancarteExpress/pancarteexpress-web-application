'use client';

import type { BlockSource } from '@/lib/orders/billing';
import styles from './ServiceBlock.module.css';

const dateFormatter = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeZone: 'America/Toronto' });
const days = (n: number) => `${n} jour${n > 1 ? 's' : ''}`;

const MESSAGES: Record<BlockSource, (delay: string) => string> = {
  self: (d) => `${d}, vous ne pourrez plus faire de demandes de service tant que vos factures ne seront pas réglées.`,
  groupAdmin: (d) =>
    `${d}, votre équipe ne pourra plus faire de demandes de service : des factures que votre administrateur de groupe doit régler sont en attente. Communiquez avec lui.`,
  member: (d) =>
    `${d}, vous ne pourrez plus faire de demandes de service : un membre de votre équipe a des factures impayées. Relancez-le.`,
};

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

  const delay = `Dans ${days(daysLeft)}, le ${dateFormatter.format(new Date(startsAt))}`;

  return (
    <dialog
      ref={openIfNeeded}
      className={styles.dialog}
      aria-labelledby="service-block-warning-title"
      onClose={handleClose}
    >
      <form method="dialog">
        <h2 id="service-block-warning-title" className={styles.dialogTitle}>
          <span aria-hidden="true">⚠️</span> Avertissement de paiement
        </h2>
        <p className={styles.dialogText}>{MESSAGES[source](delay)}</p>
        <div className={styles.dialogActions}>
          <button type="submit" className={styles.btnPrimary} autoFocus>
            OK
          </button>
        </div>
      </form>
    </dialog>
  );
}