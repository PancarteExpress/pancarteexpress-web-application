'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import styles from './languageSwitcher.module.css';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className={styles.languageSwitcher}>
      <button onClick={handleLanguageChange}>
        {locale === 'fr' ? 'English' : 'Français'}
      </button>
    </div>
  );
}