"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/types";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";

interface ForgotPasswordFormProps {
  locale: string;
}

const emailSchema = z.object({
  email: z.string().email("Invalid email"),
});

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must contain only digits"),
});

type EmailFormInput = z.infer<typeof emailSchema>;
type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");
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
      console.log("Reset submit data:", { email, ...data });

      const res = await fetch("/api/custom/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: data.password, confirmPassword: data.confirmPassword }),
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
    <div className="space-y-4">
      {/* Step 1: Email */}
      {step === "email" && (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...emailForm.register("email")}
              type="email"
              className="w-full px-3 py-2 border rounded"
            />
            {emailForm.formState.errors.email && (
              <span className="text-red-500 text-sm">{emailForm.formState.errors.email.message}</span>
            )}
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Code"}
          </button>

          <div className="text-center text-sm">
            <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Code */}
      {step === "code" && (
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
          <p className="text-sm text-gray-600">Enter the 6-digit code sent to {email}</p>

          <div>
            <label className="block text-sm font-medium">Code</label>
            <input
              {...codeForm.register("code")}
              type="text"
              maxLength={6}
              placeholder="000000"
              className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
            />
            {codeForm.formState.errors.code && (
              <span className="text-red-500 text-sm">{codeForm.formState.errors.code.message}</span>
            )}
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-blue-600 hover:underline"
          >
            Back
          </button>
        </form>
      )}

      {/* Step 3: Reset Password */}
      {step === "reset" && (
        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              {...resetForm.register("password")}
              type="password"
              className="w-full px-3 py-2 border rounded"
            />
            {resetForm.formState.errors.password && (
              <span className="text-red-500 text-sm">{resetForm.formState.errors.password.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              {...resetForm.register("confirmPassword")}
              type="password"
              className="w-full px-3 py-2 border rounded"
            />
            {resetForm.formState.errors.confirmPassword && (
              <span className="text-red-500 text-sm">{resetForm.formState.errors.confirmPassword.message}</span>
            )}
          </div>


          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}