"use client";

import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import styles from "./AuthNav.module.css"
import { useLocale, useTranslations } from 'next-intl';

interface LoginFormProps {
  locale: string;
}

export function AuthNav({ locale }: LoginFormProps) {

  const t = useTranslations('header');
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className={styles.mainContainer}>
        <Link href={`/${locale}/dashboard`}>
          {t('myAccount')}
        </Link>
        <button onClick={() => logout()}>
          {t('logout')}
        </button> 
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Link href={`/${locale}/register`}>
        {t('becomeMember')}
      </Link>
      <Link href={`/${locale}/login`}>
        {t('connection')}
      </Link>
    </div>
  );
}