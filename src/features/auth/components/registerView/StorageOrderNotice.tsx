import { getTranslations } from 'next-intl/server';
import { FaRegCheckCircle } from 'react-icons/fa';
import styles from './RegisterView.module.css';

/**
 * Invité redirigé ici après une commande avec entreposage du matériel retiré :
 * sa demande est envoyée, il crée maintenant son compte.
 */
export async function StorageOrderNotice({ locale, orderNumber }: { locale: string; orderNumber: number }) {
  const t = await getTranslations({ locale, namespace: 'register' });
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
