// src/features/auth/components/loginView/LoginView.tsx
'use client';

import styles from './LoginView.module.css';
import LoginCredentials from '../loginCredentials/LoginCredentials';

interface LoginViewProps {
  locale: string;
}

export default function LoginView({ locale }: LoginViewProps) {
  return (
    <div className={styles.mainContainer}>
      <LoginCredentials locale={locale} />
    </div>
  );
}