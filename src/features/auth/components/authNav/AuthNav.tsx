"use client";

import styles from "./AuthNav.module.css";

import { useAuth } from "../../hooks/useAuth";
import { useTranslations } from "next-intl";
import { LocalLink } from "@/shared/components/LocalLink";

interface AuthNavProps {
  onNavigate?: () => void;
}

export function AuthNav({ onNavigate }: AuthNavProps) {
  const t = useTranslations("header");
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-gray-500">{t("loading")}</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className={styles.mainContainer}>
        <LocalLink href="/dashboard" onClick={onNavigate} className={styles.navItem}>
          {t('myAccount')}
        </LocalLink>
        
        {/* Using button becaus it's an action, not only a redirection */}
        <button onClick={() => {onNavigate?.(); logout();}} >
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <LocalLink href="/register" onClick={onNavigate} className={styles.navItem}>
        {t("becomeMember")}
      </LocalLink>

      <LocalLink href="/login" onClick={onNavigate} className={styles.navItem}>
        {t("connection")}
      </LocalLink>
    </div>
  );
}