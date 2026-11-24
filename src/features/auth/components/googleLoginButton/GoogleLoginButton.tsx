"use client";

import styles from "./GoogleLoginButton.module.css";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from 'next-intl';
import { useState } from "react";

interface GoogleLoginButtonProps {
  locale: string;
  intent: "login" | "register";
  groupStatus?: "solo" | "group";
}

export function GoogleLoginButton({ locale, intent, groupStatus }: GoogleLoginButtonProps) {
  const login = useTranslations('login');
  const register = useTranslations('register');
  const [pending, setPending] = useState(false);

  const handleGoogleSignIn = async () => {
    if (pending) return;
    setPending(true);

    await fetch("/api/auth/store-group-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent,
        groupStatus: groupStatus === "group" ? "PENDING" : "SOLO",
      }),
    });
    
    document.cookie = `pendingLocale=${locale === "en" ? "en" : "fr"}; max-age=300; path=/; samesite=lax`;

    await signIn("google", {
      redirect: true,
      callbackUrl: `/${locale}/dashboard`,
    });
  };

  return (
    <div className={styles.googleLoginContainer}>
      <button type="button" onClick={handleGoogleSignIn} className={styles.googleBtn} disabled={pending}>
        <FcGoogle size={20} />
        {intent === "login" ? login('loginWithGoogle') : register('registerWithGoogle')}
      </button>
    </div>
  );
}