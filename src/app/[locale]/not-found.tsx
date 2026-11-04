import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Footer from '@/features/layout/components/footer/Footer';
import StatusPage from '@/shared/components/statusPage/StatusPage';
import styles from '@/shared/components/statusPage/StatusPage.module.css';
import { useAppLocale } from '@/shared/hooks/useAppLocale';

export default function LocaleNotFound() {
  const t = useTranslations('errorPages');
  const locale = useAppLocale();

  return (
    <>
      <StatusPage title={t('notFoundTitle')} message={t('notFoundMessage')}>
        <Link href={`/${locale}`} className={styles.primaryAction}>{t('home')}</Link>
      </StatusPage>
      <Footer />
    </>
  );
}
