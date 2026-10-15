"use client";

// Utils
import Link from "next/link";
import styles from "./HomeView.module.css";
import Image from "next/image";
import { useState } from "react";

// React icons
import { FaPaperPlane } from "react-icons/fa";
import { IoIosCheckmark } from "react-icons/io";
import { IoIosArrowDropleft } from "react-icons/io";
import { IoIosArrowDropright } from "react-icons/io";

// Framer motion
import { motion } from "framer-motion";

// Translater
import { useTranslations } from 'next-intl';
import { useAppLocale } from '@/shared/hooks/useAppLocale';


const TESTIMONIALS = [
  { key: 'chantalProvost', name: 'Chantal Provost, Proprio Direct' },
  { key: 'stephanieGauthier', name: 'Stéphanie Gauthier, RE/MAX' },
  { key: 'yzabelBrisson', name: 'Yzabel Brisson, RE/MAX' },
  { key: 'marcAndreFrancoeur', name: 'Marc-André Francoeur, RE/MAX' },
  { key: 'jaclynRabin', name: 'Jaclyn Rabin, Keller Williams Realty' },
  { key: 'jamesHe', name: 'James He, RE/MAX' },
] as const;

export default function Home() {

  const t = useTranslations('home');
  const locale = useAppLocale();

  // Un seul index : la carte de droite est toujours la suivante
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;
  const visible = [TESTIMONIALS[index], TESTIMONIALS[(index + 1) % count]];

  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  return ( 
    <div className={styles.mainContainer}>
      <div className={styles.homeHero}>
        <div className={styles.leftContent}>
          <div className={styles.heroText}>
            {locale === 'fr' && <>
            <motion.h3 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>{t('heroText1')}</motion.h3>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>{t('heroText2')}</motion.h1>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>{t('heroText3')}</motion.h2>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>{t('heroText4')}</motion.h2></>}
            
            {locale === 'en' && <>
            <motion.h3 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>{t('heroText1')}</motion.h3>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>{t('heroText2')}</motion.h2>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>{t('heroText3')}</motion.h2>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>{t('heroText4')}</motion.h1></>}
            
            <br />
            <br />
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
              <Link href="/services" className={styles.demandeButton}>
                <FaPaperPlane className={styles.demandeButtonLogo}/> {t('heroButtonService')}
              </Link>
            </motion.div>
          </div>
        </div>

        <div className={styles.rightContent}>
          <Image src="/home/pancarte-slider-v2.png" alt="Hero Pancarte" className={styles.logoPancarte} width={800} height={800} priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
        </div>
      </div>

      <div className={styles.membershipContainer}>
        <div className={styles.advantages}>
          <div className={styles.logoContainer}>
            <Image src="/home/membership.jpg" alt="Hero Pancarte" className={styles.memberLogo} width={287} height={197} priority/>
          </div>

          <div className={styles.advantagesList}>
            <h1>{t('memberAdvantagesTitle')}</h1>
            
            <div className={styles.listItem}>
              <ul>
                <li><IoIosCheckmark className={styles.checkIcon} />{t('memberAdvantages1')}</li>
                <li><IoIosCheckmark className={styles.checkIcon} />{t('memberAdvantages2')}</li>
              </ul>
              <ul>
                <li><IoIosCheckmark className={styles.checkIcon} />{t('memberAdvantages3')}</li>
                <li><IoIosCheckmark className={styles.checkIcon} />{t('memberAdvantages4')}</li>
                <li><IoIosCheckmark className={styles.checkIcon} />{t('memberAdvantages5')}</li>
              </ul>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <Link href="/register" className={styles.becomeMemberButton}>
              {t('memberButtonBecomeMember')}
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.aboutcontainer}>
        
        <div className={styles.about}>
          <h1><span>Pancarte Express</span> {t('aboutTitle')}</h1>
          <p>
            {t('aboutParagraph1')}
            <br/>
            <br/>
            {t('aboutParagraph2')}
          </p>
          <div className={styles.contactContainer}>
            <Link href="/contact" className={styles.contactButton}>
              <FaPaperPlane className={styles.contactButtonLogo}/> {t('aboutContactButton')}
            </Link>
          </div>
        </div>

        <div className={styles.examples}>
          <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-rampe.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>{t('aboutTableText1')}<br /><span className={styles.bold}>{t('aboutTableBold1')}</span></div>
          </div>
           <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-structure.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>{t('aboutTableText2')}<br /><span className={styles.bold}>{t('aboutTableBold2')}</span></div>
          </div>
           <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-mur.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>{t('aboutTableText3')}<br /><span className={styles.bold}>{t('aboutTableBold3')}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.testimonialsContainer}>
        <div className={styles.testimonialsTitle}>
          <div className={styles.whiteSpace}></div>
          <h2 className={styles.title}>{t('clientTestimonials')}</h2>
          <div className={styles.arrows}>
            <button type="button" onClick={prev} aria-label={t('previousTestimonial')}>
              <IoIosArrowDropleft className={styles.left} />
            </button>
            <button type="button" onClick={next} aria-label={t('nextTestimonial')}>
              <IoIosArrowDropright className={styles.right} />
            </button>
          </div>
        </div>

        <div className={styles.cardsContainer}>
          {visible.map(({ key, name }, i) => (
            <div key={key} className={i === 0 ? styles.cardLeft : styles.cardRight}>
              <div className={styles.logo}>
                <Image src="/home/logo_commentaires.png" alt="" className={styles.logoPancarte} width={69} height={71} />
              </div>
              <p className={styles.texte}>{t(`testimonials.${key}`)}</p>
              <h3 className={styles.name}>{name}</h3>
              <div className={styles.rate}>
                <Image src="/home/ratings.png" alt={t('fiveStars')} className={styles.logoPancarte} width={98} height={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}