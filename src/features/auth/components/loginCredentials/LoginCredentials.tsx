'use client';

import styles from './LoginCredentials.module.css';

import { useTranslations } from 'next-intl';

import { GoogleLoginButton } from "../googleLoginButton/GoogleLoginButton";
import { LoginForm } from '../loginForm/LoginForm';
import { LoginErrorMessage } from '../loginErrorMessage/LoginErrorMessage';

import { FaHouseChimney } from 'react-icons/fa6';
import { LocalLink } from '@/shared/components/LocalLink';

interface LoginCredentialsProps {
  locale: string;
}

export default function LoginCredentials({ locale }: LoginCredentialsProps) {
  const t = useTranslations('login');

  return (
    <div className={styles.credentials}>
        <div className={styles.header}>
          <FaHouseChimney size={30} style={{color: "#0E4D9A"}}/>
          <h1>{t('loginTitle')}</h1>
        </div>
        
        <LoginErrorMessage />
        <GoogleLoginButton locale={locale} intent="login" />
        
        <LoginForm locale={locale} />
        
        <div className={styles.registerRedirection}>
          {t('notRegisteredYet')}{" "}
          <LocalLink href="/register" className={styles.registerLink}>{t('createAccount')}</LocalLink>
        </div>
      </div>
  );
}