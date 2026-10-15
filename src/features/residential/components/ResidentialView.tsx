import Image from 'next/image';
import { useTranslations } from 'next-intl';
import styles from './ResidentialView.module.css';
import Link from 'next/link';
import { useAppLocale } from '@/shared/hooks/useAppLocale';


// L'ordre définit aussi les images : image1.jpg / logo1.png, etc.
const INSTALLATION_KEYS = [
  'ground',
  'illuminated',
  'railing',
  'balcony',
  'wall',
  'lockbox',
  'rider',
  'openHouseArrows',
  'flags',
] as const;

export default function Residential() {
  const t = useTranslations('residential');
   const locale = useAppLocale();

  return (
    <div className={styles.mainContainer}>
      <div className={styles.hero}>
        <h1>{t('heroTitle')}</h1>
        <p>
          {t('heroLabel1')}
          <br />
          {t('heroLabel2')}
        </p>
      </div>

      <div className={styles.redirections}>
            <div className={styles.buttons}>
                 <Link href={`/${locale}/shop`} className={styles.link}>{t('shopRedirection')}</Link>
          <Link href={`/${locale}/services`} className={styles.link}>{t('servicesRedirection')}</Link>
                    
            </div>
        </div>

      <div className={styles.grid}>
        {INSTALLATION_KEYS.map((key, i) => {
          const title = t(`cards.${key}.title`);
          return (
            <div key={key} className={styles.card}>
              <div className={styles.image}>
                <Image
                  src={`/residential/thumbnails/image${i + 1}.jpg`}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 500px) 100vw, (max-width: 1500px) 50vw, 33vw"
                />
              </div>

              <div className={styles.content}>
                <div className={styles.logoWrapper}>
                  <div className={styles.logoInner}>
                    {/* Décoratif : le titre juste à côté suffit */}
                    <Image src={`/residential/logos/logo${i + 1}.png`} alt="" fill style={{ objectFit: 'contain' }} sizes="42px" />
                  </div>
                </div>

                <div className={styles.description}>
                  <h3>{title}</h3>
                  <div className={styles.text}>
                    <p>{t(`cards.${key}.description`)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}