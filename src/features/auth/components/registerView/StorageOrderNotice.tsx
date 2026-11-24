'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FaRegCheckCircle } from 'react-icons/fa';
import styles from './RegisterView.module.css';

const STORAGE_KEY = 'storageOrder';

/**
 * Invité redirigé ici par le checkout après une commande avec entreposage :
 * sa demande est envoyée, il crée maintenant son compte. Affichée une seule fois.
 */
export function StorageOrderNotice() {
  const t = useTranslations('register');
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // sessionStorage n'existe que dans le navigateur : lu après le premier rendu
  useEffect(() => {
    try {
      const value = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY); // une seule fois : un rechargement ne la réaffiche pas
      if (value && /^\d{1,9}$/.test(value)) setOrderNumber(Number(value));
    } catch {
      // Stockage indisponible : pas de notice
    }
  }, []);

  if (orderNumber === null) return null;

  return (
    <div role="status" className={styles.storageNotice}>
      <FaRegCheckCircle aria-hidden="true" className={styles.storageNoticeIcon} />
      <p>
        {t.rich('storageOrderNotice', {
          number: orderNumber,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
    </div>
  );
}