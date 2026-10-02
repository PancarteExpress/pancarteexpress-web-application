// src/features/auth/components/RegisterCredentials.tsx
'use client';

import styles from './LoginCredentials.module.css';
import Link from "next/link";
import { GoogleLoginButton } from "../../googleLoginButton/GoogleLoginButton";
import { LoginForm } from '../LoginForm/LoginForm';
import { FaHouseChimney } from 'react-icons/fa6';

interface LoginCredentialsProps {
  locale: string;
}

export default function LoginCredentials({ locale }: LoginCredentialsProps) {
  return (
    <div className={styles.credentials}>

        <div className={styles.header}>
          <FaHouseChimney size={30} style={{color: "#0E4D9A"}}/>
          <label>Accéder à votre espace courtier</label>
        </div>
        
        <GoogleLoginButton locale={locale} />
        
        <LoginForm locale={locale} />
        
        <p style={{ color: '#7691B4', fontWeight: '700'}}>
          Pas encore inscrit?{" "}
          <Link href={`/${locale}/register`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
            Créer un compte
          </Link>
        </p>
      </div>
  );
}