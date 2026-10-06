"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/types";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";

import styles from './ForgotPasswordForm.module.css';
import { FaUnlockKeyhole } from "react-icons/fa6";

interface ForgotPasswordFormProps {
  locale: string;
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
});

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must contain only digits"),
});

type EmailFormInput = z.infer<typeof emailSchema>;
type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Step 1: Email
  const emailForm = useForm<EmailFormInput>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2: Code
  const codeForm = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
  });

  // Step 3: Reset Password
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send code");
      }

      setEmail(data.email);
      setStep("code");
      setSuccess("Code sent to your email");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      setError(errorMessage);
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Invalid code");
      }

      setCode(data.code);
      setStep("reset");
      setSuccess(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      setError(errorMessage);
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => window.location.href = `/${locale}/login`, 2000);
    } catch (err: unknown) {
      console.error("Reset error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.credentials}>
        
        {/* Step 1: Email */}
        {step === "email" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>Veuillez entrer ladresse e-mail associée à votre compte</label>
        </div>
        
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <div className={styles.inputs}>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...emailForm.register("email")}
              type="email"
            />
          </div>

          {(emailForm.formState.errors.email || error) &&
          <div className={styles.error}>
            {error || emailForm.formState.errors.email?.message}
          </div>}

          <button type="submit" disabled={isLoading} className={styles.bouton}>
            {isLoading ? "Sending..." : "Send Code"}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href={`/${locale}/login`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
              Back to login
            </Link>
          </div>
        </form>
        </>
        )}

        {/* Step 2: Code */}
        {step === "code" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>Enter the 6-digit code sent to <span style={{ fontWeight: '700' }}>{email}</span></label>
        </div>
        
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} >

          <div className={styles.inputs}>
            <label className="block text-sm font-medium">Code</label>
            <input
              {...codeForm.register("code")}
              type="text"
              maxLength={6}
              placeholder="000000"
              className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
            />
          </div>

          {(codeForm.formState.errors.code || error) &&
          <div className={styles.error}>
            {error || codeForm.formState.errors.code?.message}
          </div>}

          {success && <div className={styles.codeSent}>{success}</div>}

          <button type="submit" disabled={isLoading} className={styles.bouton}>
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={() => setStep("email")} style={{ all: 'unset', textDecoration: 'none', color: '#0E4D9A', fontWeight: '700', cursor: 'pointer' }}>
              Back to send code
            </button>
          </div>
        </form>
        </>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (<>
        <div className={styles.header}>
          <FaUnlockKeyhole size={30} style={{color: "#0E4D9A"}}/>
          <label>Veuillez entrer votre nouveau mot de passe</label>
        </div>

        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
          <div className={styles.inputs}>
            <label className="block text-sm font-medium">New Password</label>
            <input
              {...resetForm.register("password")}
              type="password"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className={styles.inputs}>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              {...resetForm.register("confirmPassword")}
              type="password"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {(resetForm.formState.errors.password ||resetForm.formState.errors.confirmPassword || error) &&
          <div className={styles.error}>
            {resetForm.formState.errors.password?.message || resetForm.formState.errors.confirmPassword?.message || error}
          </div>}

          {success && <div className={styles.codeSent}>{success}</div>}

           <button type="submit" disabled={isLoading} className={styles.bouton}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}