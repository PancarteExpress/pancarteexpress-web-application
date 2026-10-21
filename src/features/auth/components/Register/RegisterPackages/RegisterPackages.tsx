// src/features/auth/components/RegisterPackages.tsx
'use client';

import { useRouter } from 'next/navigation';
import styles from './RegisterPackages.module.css';
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';

interface RegisterPackagesProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
  setPackageChoice: (value: "group" | "solo" | 'none') => void;
  setStep: (step: "packages" | "register") => void;
}

export default function RegisterPackages({ locale, packageChoice, setPackageChoice, setStep }: RegisterPackagesProps) {
  const t = useTranslations('register');
  const router = useRouter();
  
  const handleSelectPackage = (packageType: "solo" | "group" | 'none' ) => {
    setPackageChoice(packageType);
   
    if (packageType === 'none') {
      router.push(`/${locale}/services`);
    } else {
      setStep("register");
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.packages}>
        <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className={styles.package} onClick={() => handleSelectPackage('none')}>
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

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait
          </button>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className={styles.package} onClick={() => handleSelectPackage("group")}>
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

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className={styles.package} onClick={() => handleSelectPackage("solo")}>
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

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait
          </button>
        </motion.div>
      </div>
    </div>
  );
}