// src/features/auth/components/RegisterPackages.tsx
'use client';

import type { CSSProperties } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import styles from './RegisterPackages.module.css';
import { useRouter } from 'next/navigation';

type PackageChoice = 'none' | 'group' | 'solo';

type FeatureKey =
  | 'storage' | 'storageUnlimited' | 'storageLimited'
  | 'inventoryManagement' | 'inventoryManagementDetailed' | 'inventoryAlerts'
  | 'promoCode' | 'signageDiscount'
  | 'billingPerOrder' | 'billingMonthly' | 'payment'
  | 'installation24h' | 'installation24hEmergency' | 'confirmationPhoto'
  | 'idealForTeams' | 'idealForSolo';

type Feature = { key: FeatureKey; included?: boolean; highlight?: boolean };

const EXCLUDED = { included: false } as const;
const HIGHLIGHT = { highlight: true } as const;

type PackageConfig = {
  choice: PackageChoice;
  titleKey: 'package1Title' | 'package2Title' | 'package3Title';
  price: number;
  preferentialPrices: [number, number];
  listColor: string;
  highlightColor?: string;
  animation: MotionProps;
  features: Feature[];
};

const LIST_STYLE: CSSProperties = { textAlign: 'center', listStyle: 'none', padding: 0 };

const PACKAGES: PackageConfig[] = [
  {
    choice: 'none',
    titleKey: 'package1Title',
    price: 0,
    preferentialPrices: [45, 50],
    listColor: '#0E4D9A',
    animation: { initial: { opacity: 0, x: -100 }, animate: { opacity: 1, x: 0 }, transition: { duration: 1 } },
    features: [
      { key: 'storage', ...EXCLUDED },
      { key: 'inventoryManagement', ...EXCLUDED },
      { key: 'inventoryAlerts', ...EXCLUDED },
      { key: 'promoCode', ...EXCLUDED },
      { key: 'signageDiscount', ...EXCLUDED },
      { key: 'billingPerOrder' },
      { key: 'payment' },
      { key: 'installation24h' },
    ],
  },
  {
    choice: 'group',
    titleKey: 'package2Title',
    price: 119.99,
    preferentialPrices: [30, 35],
    listColor: '#C8DAEC',
    highlightColor: 'yellow',
    animation: { initial: { opacity: 0, y: 100 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1 } },
    features: [
      { key: 'storageUnlimited' },
      { key: 'inventoryManagementDetailed' },
      { key: 'inventoryAlerts' },
      { key: 'promoCode' },
      { key: 'signageDiscount' },
      { key: 'billingMonthly', ...HIGHLIGHT },
      { key: 'payment', ...HIGHLIGHT },
      { key: 'installation24hEmergency' },
      { key: 'confirmationPhoto' },
      { key: 'idealForTeams' },
    ],
  },
  {
    choice: 'solo',
    titleKey: 'package3Title',
    price: 89.99,
    preferentialPrices: [30, 35],
    listColor: '#0E4D9A',
    highlightColor: 'red',
    animation: { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 }, transition: { duration: 1 } },
    features: [
      { key: 'storageLimited' },
      { key: 'inventoryManagementDetailed' },
      { key: 'inventoryAlerts' },
      { key: 'promoCode' },
      { key: 'signageDiscount' },
      { key: 'billingMonthly', ...HIGHLIGHT },
      { key: 'payment', ...HIGHLIGHT },
      { key: 'installation24hEmergency' },
      { key: 'confirmationPhoto' },
      { key: 'idealForSolo' },
    ],
  },
];

interface RegisterPackagesProps {
  setPackageChoice: (value: PackageChoice) => void;
  setStep: (step: 'packages' | 'register') => void;
}

export default function RegisterPackages({ setPackageChoice, setStep }: RegisterPackagesProps) {
  const t = useTranslations('register');
  const locale = useLocale();
  const router = useRouter();

  // « 0 $ » / « 119,99 $ » en FR, « $0 » / « $119.99 » en EN
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CAD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);

  const handleSelectPackage = (choice: PackageChoice) => {
    setPackageChoice(choice);
    if (choice === 'none') router.push('/services');
    else setStep('register');
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.packages}>
        {PACKAGES.map(({ choice, titleKey, price, preferentialPrices, listColor, highlightColor, animation, features }) => (
          <motion.div
            key={choice}
            {...animation}
            className={styles.package}
            onClick={() => handleSelectPackage(choice)}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>{t(titleKey)}</h2>
              <label>{formatPrice(price)}</label>
              <br />
              <label>{t('packagesPerYear')}</label>
            </div>

            <p className={styles.price}>
              <label>
                {t('packagePreferentialPrice')} : {preferentialPrices.map(formatPrice).join(' / ')}
              </label>
            </p>

            <ul style={{ ...LIST_STYLE, color: listColor }}>
              {features.map(({ key, included = true, highlight }) => (
                <li
                  key={key}
                  style={{
                    ...(!included && { opacity: 0.5 }),
                    ...(highlight && highlightColor && { color: highlightColor }),
                  }}
                >
                  {included ? '✓' : '✗'} {t(`packageFeatures.${key}`)}
                </li>
              ))}
            </ul>

            {/* Le clic remonte jusqu'à la carte : pas besoin d'onClick ici */}
            <button type="button" className={styles.selectPackageButton}>
              {t('selectPackage')}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}