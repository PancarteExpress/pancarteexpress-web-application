// src/features/auth/components/RegisterCredentials.tsx
'use client';

import styles from './RegisterCredentials.module.css';
import Link from "next/link";
import { GoogleLoginButton } from "../../googleLoginButton/GoogleLoginButton";
import { RegisterForm } from "../registerForm/RegisterForm";

interface RegisterCredentialsProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
}

export default function RegisterCredentials({ locale, packageChoice }: RegisterCredentialsProps) {
  return (
    <div className={styles.credentials}>
      <h1 className="text-3xl font-bold mb-8 text-center">
        Créer un compte
      </h1>
      
      
      
      <RegisterForm locale={locale} packageChoice={packageChoice} />
      
      <p style={{ color: '#7691B4', fontWeight: '700'}}>
        Déjà inscrit?{" "}
        <Link href={`/${locale}/login`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}