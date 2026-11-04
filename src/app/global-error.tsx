'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import en from '@/messages/en/errorPages.json';
import fr from '@/messages/fr/errorPages.json';
import StatusPage from '@/shared/components/statusPage/StatusPage';
import styles from '@/shared/components/statusPage/StatusPage.module.css';

// Remplace le layout racine : aucun fournisseur next-intl n'est disponible ici
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = usePathname()?.split('/')[1] === 'en' ? 'en' : 'fr';
  const t = locale === 'en' ? en : fr;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className={styles.document}>
        <StatusPage title={t.errorTitle} message={t.errorMessage}>
          <button type="button" onClick={reset} className={styles.primaryAction}>{t.retry}</button>
          {/* Rechargement complet : le layout racine est en échec */}
          <a href={`/${locale}`} className={styles.action}>{t.home}</a>
        </StatusPage>
      </body>
    </html>
  );
}
