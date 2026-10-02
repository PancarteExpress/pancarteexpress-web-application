"use client";

import styles from "./GoogleLoginButton.module.css";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

interface GoogleLoginButtonProps {
  locale: string;
  groupStatus?: "solo" | "group";
}

export function GoogleLoginButton({ locale, groupStatus }: GoogleLoginButtonProps) {
  
  const handleGoogleSignIn = async () => {

    if (groupStatus) {
      await fetch("/api/auth/store-group-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          groupStatus: groupStatus === 'group' ? 'PENDING' : 'SOLO' 
        }),
      });
    }
    
    await signIn("google", {
      redirect: true,
      callbackUrl: `/${locale}/dashboard`,
    });
  };

  return (
    <div className={styles.googleLoginContainer}>
      <button onClick={handleGoogleSignIn} className={styles.googleBtn}>
        <FcGoogle size={20} />
        Se connecter avec Google
      </button>
    </div>
  );
}