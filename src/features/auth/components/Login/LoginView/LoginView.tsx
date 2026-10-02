// src/features/auth/components/LoginView.tsx
'use client';

import styles from './LoginView.module.css';
import Link from "next/link";
import { FaHouseChimney } from "react-icons/fa6";
import { GoogleLoginButton } from '../../googleLoginButton/GoogleLoginButton';
import { LoginForm } from '../LoginForm/LoginForm';
import LoginCredentials from '../LoginCredentials/LoginCredentials';

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