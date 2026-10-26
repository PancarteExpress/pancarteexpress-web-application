// src/features/auth/components/RegisterCredentials.tsx
'use client';

import styles from './RegisterCredentials.module.css';
import Link from "next/link";
import { GoogleLoginButton } from "../../googleLoginButton/GoogleLoginButton";
import { RegisterForm } from "../registerForm/RegisterForm";
import { FaHouseChimney } from 'react-icons/fa6';
import { useEffect } from 'react';
import { MdGroups2 } from 'react-icons/md';
import { IoPersonAdd } from 'react-icons/io5';
import { useTranslations } from 'next-intl';

interface RegisterCredentialsProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
  setPackageChoice: (value: "group" | "solo" | 'none') => void;
  onFormStepChange?: (step: "register" | "verify") => void;
}

export default function RegisterCredentials({ locale, packageChoice, setPackageChoice, onFormStepChange }: RegisterCredentialsProps) {
  const t = useTranslations('register');

  return (
    <div className={styles.credentials}>
      <div className={styles.header}>
        {packageChoice === 'group' ? (
          <MdGroups2 size={70} style={{color: "#0E4D9A"}}/>
        ) : (
          <IoPersonAdd  size={70} style={{color: "#0E4D9A"}}/>
        )}
        <label>{t('formTitle')}</label>
        <h3>{packageChoice === 'group' ? t('formPackageGroup') : t('formPackageSolo')}</h3>
      </div>

      <RegisterForm 
        locale={locale} 
        packageChoice={packageChoice} 
        setPackageChoice={setPackageChoice}
        onStepChange={onFormStepChange}
      />
      
      <p style={{ color: '#7691B4', fontWeight: '700', textAlign: 'center', marginTop: '1rem' }}>
        {t('alreadyMember')}{" "}
        <Link href={`/${locale}/login`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
          {t('connect')}
        </Link>
      </p>
    </div>
  );
}