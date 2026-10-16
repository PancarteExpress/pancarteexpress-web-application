'use client';

import styles from './RegisterView.module.css';

import RegisterCredentials from '../RegisterCredentials/RegisterCredentials';
import RegisterPackages from '../RegisterPackages/RegisterPackages';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterViewProps {
  locale: string;
}

export default function RegisterView({ locale }: RegisterViewProps) {  

  const t = useTranslations('register');
  
  const [step, setStep] = useState<"packages" | "register">("packages");
  const [formStep, setFormStep] = useState<"register" | "verify">("register");
  const [packageChoice, setPackageChoice] = useState<"group" | "solo" | 'none'>('none');

  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>
        {step === "packages" && 
        <RegisterPackages
          setPackageChoice={setPackageChoice}
          setStep={setStep}
        />}

        {step === "register" && <>
        
        {formStep === "register" && (  // ← Affiche le bouton seulement si formStep === "register"
          <button type='button' className={styles.backToPackages} onClick={() => setStep('packages')}>
            {t('btnPackages')}
          </button>
        )}

        <RegisterCredentials 
          locale={locale} packageChoice={packageChoice}
          setPackageChoice={setPackageChoice}
          onFormStepChange={setFormStep}
        />
        </>}
        </div>
    </div>
  );
}