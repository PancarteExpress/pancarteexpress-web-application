// src/features/auth/components/RegisterCredentials.tsx
'use client';

import styles from './LoginCredentials.module.css';
import Link from "next/link";
import { GoogleLoginButton } from "../../googleLoginButton/GoogleLoginButton";
import { LoginForm } from '../LoginForm/LoginForm';
import { FaHouseChimney } from 'react-icons/fa6';
import { useTranslations } from 'next-intl';
import { LoginErrorMessage } from '../../loginErrorMessage/LoginErrorMessage';

interface LoginCredentialsProps {
  locale: string;
}

export default function LoginCredentials({ locale }: LoginCredentialsProps) {
  const t = useTranslations('login');

  return (
    <div className={styles.credentials}>

        <div className={styles.header}>
          <FaHouseChimney size={30} style={{color: "#0E4D9A"}}/>
          <label>{t('loginTitle')}</label>
        </div>
        
        <LoginErrorMessage locale={locale} />
        <GoogleLoginButton locale={locale} intent="login" />
        
        <LoginForm locale={locale} />
        
        <p style={{ color: '#7691B4', fontWeight: '700'}}>
          {t('notRegisteredYet')}{" "}
          <Link href={`/${locale}/register`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
            {t('createAccount')}
          </Link>
        </p>
      </div>
  );
}