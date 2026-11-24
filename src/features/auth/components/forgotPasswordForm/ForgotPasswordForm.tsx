"use client";

import styles from './ForgotPasswordForm.module.css';

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, resetPasswordSchema, verifyCodeSchema, type ResetPasswordInput } from "@/lib/auth/auth.schema";
import { readErrorCode } from "@/lib/errors/appError";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import { LocalLink } from "@/shared/components/LocalLink";

import { FaUnlockKeyhole } from "react-icons/fa6";

interface ForgotPasswordFormProps {
  locale: string;
}

type Step = "email" | "code" | "reset";

const emailSchema = forgotPasswordSchema.pick({ email: true });

type EmailFormInput = z.infer<typeof emailSchema>;
type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const tErrors = useTranslations("errors");
  const t = useTranslations("login.forgotPassword");
  const tv = useIssueMessage("errors.validation");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const emailForm = useForm<EmailFormInput>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<VerifyCodeInput>({ resolver: zodResolver(verifyCodeSchema) });
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  // Changer d'étape efface les messages de l'étape précédente
  const goToStep = (next: Step, successMessage: string | null = null) => {
    setError(null);
    setSuccess(successMessage);
    setStep(next);
  };

  const handleEmailSubmit = async (data: EmailFormInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/custom/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      if (!res.ok) {
        setError(tErrors(await readErrorCode(res)));
        return;
      }

      setEmail(data.email);
      codeForm.reset();
      goToStep("code", t("codeSent"));
    } catch {
      setError(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (data: VerifyCodeInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/custom/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });

      if (!res.ok) {
        setSuccess(null);
        setError(tErrors(await readErrorCode(res)));
        return;
      }

      setCode(data.code);
      goToStep("reset");
    } catch {
      setSuccess(null);
      setError(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/custom/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password: data.password, confirmPassword: data.confirmPassword }),
      });

      if (!res.ok) {
        setError(tErrors(await readErrorCode(res)));
        return;
      }

      setIsDone(true);
      setSuccess(t("resetSuccess"));
      setTimeout(() => window.location.replace(`/${locale}/login`), 2000);
    } catch {
      setError(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  const codeError = error || tv(codeForm.formState.errors.code?.message);
  const resetError =
    tv(resetForm.formState.errors.password?.message) ||
    tv(resetForm.formState.errors.confirmPassword?.message) ||
    error;

  return (
    <div className={styles.mainContainer}>
      <div className={styles.credentials}>

        {/* Step 1: Email */}
        {step === "email" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>{t("emailPrompt")}</label>
        </div>

        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} noValidate>
          <div className={styles.inputs}>
            <label htmlFor="forgot-email" className="block text-sm font-medium">{t("email")}</label>
            <input
              id="forgot-email"
              {...emailForm.register("email")}
              type="email"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {(emailForm.formState.errors.email || error) &&
          <div className={styles.error}>
            {error || tv(emailForm.formState.errors.email?.message)}
          </div>}

          <button type="submit" disabled={isLoading} className={styles.bouton}>
            {isLoading ? t("sending") : t("sendCode")}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <LocalLink href="/login" style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
              {t("backToLogin")}
            </LocalLink>
          </div>
        </form>
        </>
        )}

        {/* Step 2: Code */}
        {step === "code" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>
            {t.rich("enterCode", {
              email,
              bold: (chunks) => <span style={{ fontWeight: '700' }}>{chunks}</span>,
            })}
          </label>
        </div>

        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} noValidate>
          <div className={styles.inputs}>
            <label htmlFor="forgot-code" className="block text-sm font-medium">{t("code")}</label>
            <input
              id="forgot-code"
              {...codeForm.register("code")}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="000000"
              disabled={isLoading}
              className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
            />
          </div>

          {/* Un seul message à la fois : l'erreur passe avant le succès */}
          {codeError
            ? <div className={styles.error}>{codeError}</div>
            : success && <div className={styles.codeSent}>{success}</div>}

          <button type="submit" disabled={isLoading} className={styles.bouton}>
            {isLoading ? t("verifying") : t("verifyCode")}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={() => goToStep("email")} disabled={isLoading} style={{ all: 'unset', textDecoration: 'none', color: '#0E4D9A', fontWeight: '700', cursor: 'pointer' }}>
              {t("backToSendCode")}
            </button>
          </div>
        </form>
        </>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>{t("newPasswordPrompt")}</label>
        </div>

        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4" noValidate>
          <div className={styles.inputs}>
            <label htmlFor="forgot-password" className="block text-sm font-medium">{t("newPassword")}</label>
            <input
              id="forgot-password"
              {...resetForm.register("password")}
              type="password"
              autoComplete="new-password"
              autoFocus
              disabled={isLoading || isDone}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className={styles.inputs}>
            <label htmlFor="forgot-confirm-password" className="block text-sm font-medium">{t("confirmPassword")}</label>
            <input
              id="forgot-confirm-password"
              {...resetForm.register("confirmPassword")}
              type="password"
              autoComplete="new-password"
              disabled={isLoading || isDone}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {resetError
            ? <div className={styles.error}>{resetError}</div>
            : success && <div className={styles.codeSent}>{success}</div>}

          <button type="submit" disabled={isLoading || isDone} className={styles.bouton}>
            {isLoading ? t("resetting") : t("resetPassword")}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}