
import styles from './page.module.css';

import { LoginForm } from "@/features/auth/components/loginForm/LoginForm";
import { GoogleLoginButton } from "@/features/auth/components/googleLoginButton/GoogleLoginButton";
import Link from "next/link";
import { use } from "react";

import { FaHouseChimney } from "react-icons/fa6";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.credentials}>

        <div className={styles.header}>
          <FaHouseChimney size={30} style={{color: "#0E4D9A"}}/>
          <label>Accéder à votre espace courtier</label>
        </div>
        
        <GoogleLoginButton locale={locale} />
        
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t"></div>
          <span className="px-2 text-sm text-gray-500">ou</span>
          <div className="flex-1 border-t"></div>
        </div>
        
        <LoginForm locale={locale} />
        
        <p style={{ color: '#7691B4', fontWeight: '700'}}>
          Pas encore inscrit?{" "}
          <Link href={`/${locale}/register`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}