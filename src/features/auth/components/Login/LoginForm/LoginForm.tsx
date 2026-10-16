"use client";

import styles from './LoginForm.module.css';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { useAuthStore } from '../../../store/authStore';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations('login');

  const router = useRouter();
  const { login } = useAuth();

  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [success, setSuccess] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    const result = await login(data);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        window.location.replace(`/${locale}/dashboard`);
      }, 1000);  // 1 seconde
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.mainContainer}>
      <div className={styles.inputs}>
        <label htmlFor="loginId" className="block text-sm font-medium mb-1">{t('formId')}</label>
        <input
          autoComplete="off"
          id="loginId"
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
      </div>

      <div className={styles.inputs}>
        <label htmlFor="loginPassword" className="block text-sm font-medium mb-1">{t('formPassword')}</label>
        <input
          autoComplete="new-password"
          id="loginPassword"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
      </div>

      <div className={styles.forgotPassword}>
        <Link href={`/${locale}/forgot-password`}>
          {t('formForgotPassword')}
        </Link>
      </div>

      {isLoading &&
      <div className={styles.loading}>
        {t('tryingToConnect')}
      </div>}

      {(errors.root || error) &&
      <div className={styles.error}>
        {error || errors.root?.message}
      </div>}
      
      {success &&
      <div className={styles.success}>
        {t('connectedSuccessfully')}
      </div>}

      <button type="submit" disabled={isLoading} className={styles.btnConnection}>
        {t('connectionBtn')}
      </button>

    </form>
  );
}