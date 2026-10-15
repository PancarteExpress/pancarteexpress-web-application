import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import styles from './BigFormatView.module.css';

type SectionKey =
  | 'rigidDisplay'
  | 'flexibleDisplay'
  | 'configurations'
  | 'suggestedSizes'
  | 'suggestedSizesHW'
  | 'material'
  | 'colors'
  | 'signSizes'
  | 'displayTypes';

type CardConfig = {
  key: string;
  sections: SectionKey[];
  rentable?: boolean; // affiche le bloc « achat ou location »
};

// L'ordre définit aussi les images : image1.jpg, etc.
const CARDS: CardConfig[] = [
  { key: 'miniRigid', sections: ['rigidDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'standardRigid', sections: ['rigidDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'largeRigid', sections: ['rigidDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'miniFlexible', sections: ['flexibleDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'standardFlexible', sections: ['flexibleDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'largeFlexible', sections: ['flexibleDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'miniV', sections: ['rigidDisplay', 'configurations', 'suggestedSizesHW'], rentable: true },
  { key: 'wood', sections: ['material', 'colors', 'signSizes'], rentable: true },
  { key: 'standardV', sections: ['rigidDisplay', 'configurations', 'suggestedSizes'], rentable: true },
  { key: 'woodEasel', sections: ['signSizes'] },
  { key: 'boomLift', sections: ['displayTypes'] },
  { key: 'commercialWall', sections: ['signSizes'] },
];

export default function BigFormat() {
  const t = useTranslations('bigFormat');

  return (
    <div className={styles.mainContainer}>
      <div className={styles.hero}>
        <h1>{t('heroTitle')}</h1>
        <p>
          {t('heroLabel1')}
          <br />
          {t('heroLabel2')}
          <br />
          {t('heroLabel3')}
        </p>
      </div>

      <div className={styles.redirections}>
        <div className={styles.buttons}>
          <Link href={{ pathname: '/shop', query: { category: 'bigFormatStructure' } }} className={styles.link}>
            {t('shopRedirection')}
          </Link>
          <Link href="/services" className={styles.link}>
            {t('servicesRedirection')}
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        {CARDS.map(({ key, sections, rentable }, i) => {
          const title = t(`cards.${key}.title`);
          const hasDescription2 = t.has(`cards.${key}.description2`);

          return (
            <div key={key} className={styles.card}>
              <div className={styles.image}>
                <Image
                  src={`/commercial/thumbnails/image${i + 1}.jpg`}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 500px) 100vw, (max-width: 1500px) 50vw, 33vw"
                />
              </div>

              <div className={styles.content}>
                <div className={styles.logoWrapper}>
                  <div className={styles.logoInner}>
                    <Image src={`/commercial/logos/logo${(i % 4) + 1}.png`} alt="" fill style={{ objectFit: 'contain' }} sizes="42px" />
                  </div>
                </div>

                <div className={styles.description}>
                  <h3>{title}</h3>
                  <div className={styles.text}>
                    <p>
                      {t(`cards.${key}.description1`)}
                      {hasDescription2 && (
                        <>
                          <br />
                          <br />
                          {t(`cards.${key}.description2`)}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {sections.map((section) => (
                  <div key={section} className={styles.text}>
                    <h4>{t(`sectionTitles.${section}`)}</h4>
                    <p>{t(`cards.${key}.sections.${section}`)}</p>
                  </div>
                ))}

                {rentable && (
                  <div className={styles.infos}>
                    <p>{t('rentalInfo')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}