"use client";

import styles from "./GoogleLoginButton.module.css";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

interface GoogleLoginButtonProps {
  locale: string;
}

export function GoogleLoginButton({ locale }: GoogleLoginButtonProps) {
  const handleGoogleSignIn = async () => {
    await signIn("google", {
      redirect: true,
      callbackUrl: `/${locale}/dashboard`,
    });
  };

  return (
    <button onClick={handleGoogleSignIn} className={styles.googleBtn}>
      <FcGoogle size={20} />
      Se connecter avec Google
    </button>
  );
}