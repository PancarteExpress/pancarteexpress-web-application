// src/features/auth/components/registerPackages/RegisterPackages.tsx
'use client';

import Link from 'next/link';
import styles from './RegisterPackages.module.css';
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';

interface RegisterPackagesProps {
  locale: string;
}

const MotionLink = motion.create(Link);

export default function RegisterPackages({ locale }: RegisterPackagesProps) {
  const t = useTranslations('register');

  return (
    <div className={styles.mainContainer}>
      <div className={styles.packages}>
        <MotionLink initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className={styles.package} href={`/${locale}/services`}>
          <div className={styles.header}>
            <h2 className={styles.title}>{t('package1Title')}</h2>
            
            <label>0$</label>
            <br />
            <label>{t('packagesCurrency')}</label>
          </div>

          <p className={styles.price}>
            <label>{t('notMemberPrice')}</label>
          </p>

          <ul>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x {t('notMemberStorage')}</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x {t('inventoryManagement')}</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x {t('inventoryAlerts')}</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x {t('promoCode')}</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x {t('emergency')}</li>
            <li style={{ color: '#0E4D9A'}}>✓ {t('notMemberBilling')}</li>
            <li style={{ color: '#0E4D9A'}}>✓ {t('notMemberPayment')}</li>
            <li style={{ color: '#0E4D9A'}}>✓ {t('installation24h')}</li>
            <li style={{ color: '#0E4D9A'}}>✓ {t('confirmationPhoto')}</li>
            
          </ul>

          <span className={styles.selectPackageButton}>
            {t('selectPackage')}
          </span>
        </MotionLink>
        
        <MotionLink initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className={styles.package} href={`/${locale}/register/account?plan=group`}>
          <div className={styles.header}>
            
            <h2 className={styles.title}>{t('package2Title')}</h2>

            <label>119.99$</label>
            <br />
            <label>{t('packagesCurrency')}</label>

          </div>

          <p className={styles.price}>
            <label>{t('groupPrice')}</label>
          </p>

          <ul style={{ color: '#C8DAEC', textAlign: 'center', listStyle: 'none', padding: 0 }}>
            <li>✓ {t('bigFormatStorage')}</li>
            <li>✓ {t('groupStorage')}</li>
            <li>✓ {t('inventoryManagement')}</li>
            <li>✓ {t('inventoryAlerts')}</li>
            <li>✓ {t('promoCode')}</li>
            <li>✓ {t('emergency')}</li>
            <li>✓ {t('memberBilling')}</li>
            <li>✓ {t('memberPayment')}</li>
            <li>✓ {t('installation24h')}</li>
            <li>✓ {t('confirmationPhoto')}</li>
            <li>✓ {t('idealForGroup')}</li>
          </ul>

          <span className={styles.selectPackageButton}>
            {t('selectPackage')}
          </span>
        </MotionLink>

        <MotionLink initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className={styles.package} href={`/${locale}/register/account?plan=solo`}>
          <div className={styles.header}>
            <h2 className={styles.title}>{t('package3Title')}</h2>
            
            <label>89.99$</label>
            <br />
            <label>{t('packagesCurrency')}</label>
          </div>
          
          <p className={styles.price}>
            <label>{t('soloPrice')}</label>
          </p>

          <ul style={{ color: '#0E4D9A', textAlign: 'center', listStyle: 'none', padding: 0 }}>
            <li style={{opacity: '0.5'}}>x {t('bigFormatStorage')}</li>
            <li>✓ {t('soloStorage')}</li>
            <li>✓ {t('inventoryManagement')}</li>
            <li>✓ {t('inventoryAlerts')}</li>
            <li>✓ {t('promoCode')}</li>
            <li>✓ {t('emergency')}</li>
            <li>✓ {t('memberBilling')}</li>
            <li>✓ {t('memberPayment')}</li>
            <li>✓ {t('installation24h')}</li>
            <li>✓ {t('confirmationPhoto')}</li>
            <li>✓ {t('idealForSolo')}</li>
          </ul>

          <span className={styles.selectPackageButton}>
            {t('selectPackage')}
          </span>
        </MotionLink>
      </div>
    </div>
  );
}