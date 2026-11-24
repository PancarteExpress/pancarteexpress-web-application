"use client";

import styles from './LoginForm.module.css';
import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from 'next-intl';
import { loginSchema, type LoginInput } from "@/lib/auth/auth.schema";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from '../../store/authStore';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import { LocalLink } from '@/shared/components/LocalLink';

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations('login');
  const tv = useIssueMessage('errors.validation');
  const { login } = useAuth();

  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // Erreur laissée par une autre page (ex. l'inscription) : ne pas l'afficher ici
  useEffect(() => {
    useAuthStore.getState().clearError();
  }, []);

  const onSubmit = async (data: LoginInput) => {
    const result = await login(data);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        window.location.replace(`/${locale}/dashboard`);
      }, 1000);
    }
  };

  // Première erreur, quel que soit le champ (avant : les champs vides n'affichaient rien)
  const firstFieldError = Object.values(errors).find((e) => e?.message)?.message;
  const errorMessage = tv(firstFieldError) || error;

  // Un seul message à la fois : le plus pertinent gagne
  const feedback =
    success ? { className: styles.success, role: 'status', text: t('connectedSuccessfully') }
    : isLoading ? { className: styles.loading, role: 'status', text: t('tryingToConnect') }
    : errorMessage ? { className: styles.error, role: 'alert', text: errorMessage }
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.mainContainer} noValidate>
      <div className={styles.inputs}>
        <label htmlFor="loginId" className="block text-sm font-medium mb-1">{t('formId')}</label>
        <input
          id="loginId"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.identifier) || undefined}
          {...register("identifier")}
          disabled={isLoading || success}
        />
      </div>

      <div className={styles.inputs}>
        <label htmlFor="loginPassword" className="block text-sm font-medium mb-1">{t('formPassword')}</label>
        <input
          id="loginPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password) || undefined}
          {...register("password")}
          disabled={isLoading || success}
        />
      </div>

      <div className={styles.forgotPassword}>
        <LocalLink href="/forgot-password">{t('formForgotPassword')}</LocalLink>
      </div>

      {feedback && (
        <div className={feedback.className} role={feedback.role}>
          {feedback.text}
        </div>
      )}

      <button type="submit" disabled={isLoading || success} className={styles.btnConnection}>
        {t('connectionBtn')}
      </button>
    </form>
  );
}