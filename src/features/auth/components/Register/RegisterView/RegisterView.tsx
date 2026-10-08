'use client';

import styles from './RegisterView.module.css';

import RegisterCredentials from '../RegisterCredentials/RegisterCredentials';
import RegisterPackages from '../RegisterPackages/RegisterPackages';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterViewProps {
  locale: string;
}

export default function RegisterView({ locale }: RegisterViewProps) {  
  
  const [step, setStep] = useState<"packages" | "register">("packages");
  const [packageChoice, setPackageChoice] = useState<"group" | "solo" | 'none'>('none');

  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>
        {step === "packages" && 
        <RegisterPackages 
          locale={locale}
          packageChoice={packageChoice} 
          setPackageChoice={setPackageChoice}
          setStep={setStep}
        />}

        {step === "register" && <>
        <button type='button' className={styles.backToPackages} onClick={() => setStep('packages')}>Revenir à la description des forfaits</button>
        <RegisterCredentials 
          locale={locale} packageChoice={packageChoice}
          setPackageChoice={setPackageChoice}
        />
        </>}
        </div>
    </div>
  );
}