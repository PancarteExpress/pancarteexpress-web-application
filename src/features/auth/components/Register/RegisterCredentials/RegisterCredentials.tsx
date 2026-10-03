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

interface RegisterCredentialsProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
  setPackageChoice: (value: "group" | "solo" | 'none') => void;
}

export default function RegisterCredentials({ locale, packageChoice, setPackageChoice }: RegisterCredentialsProps) {

  return (
    <div className={styles.credentials}>
      <div className={styles.header}>
        {packageChoice === 'group' ? (
          <MdGroups2 size={70} style={{color: "#0E4D9A"}}/>
        ) : (
          <IoPersonAdd  size={70} style={{color: "#0E4D9A"}}/>
        )}
        <label>Creer votre espace courtier</label>
        <h3> {packageChoice === 'group' ? 'Vous vous appretez à rejoindre une equipe de courtier ' : 'Vous vous appretez à créer votre espace courtier' }</h3>
      </div>

      <RegisterForm 
        locale={locale} 
        packageChoice={packageChoice} 
        setPackageChoice={setPackageChoice}
      />
      
      <p style={{ color: '#7691B4', fontWeight: '700', textAlign: 'center', marginTop: '1rem' }}>
        Déjà inscrit?{" "}
        <Link href={`/${locale}/login`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}