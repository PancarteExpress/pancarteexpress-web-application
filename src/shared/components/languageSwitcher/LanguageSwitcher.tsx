'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { buildLocaleUrl } from '@/shared/utils/pathname';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    // Lu au moment du clic : ?plan= peut avoir changé via history.replaceState, et le hash n'est pas exposé par les hooks
    const { pathname, search, hash } = window.location;
    router.push(buildLocaleUrl(pathname, search, hash, locale, newLocale));
  };

  return (
    <div className={styles.languageSwitcher}>
      <button onClick={handleLanguageChange}>
        {locale === 'fr' ? 'English' : 'Français'}
      </button>
    </div>
  );
}