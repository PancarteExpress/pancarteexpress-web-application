'use client';

import { startTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Footer from '@/features/layout/components/footer/Footer';
import StatusPage from '@/shared/components/statusPage/StatusPage';
import styles from '@/shared/components/statusPage/StatusPage.module.css';
import { useAppLocale } from '@/shared/hooks/useAppLocale';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errorPages');
  const locale = useAppLocale();
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Une erreur de composant serveur ne se répare qu'en redemandant les données
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <>
      <StatusPage title={t('errorTitle')} message={t('errorMessage')}>
        <button type="button" onClick={retry} className={styles.primaryAction}>{t('retry')}</button>
        <Link href={`/${locale}`} className={styles.action}>{t('home')}</Link>
      </StatusPage>
      <Footer />
    </>
  );
}
