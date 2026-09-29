"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResetPasswordFormProps {
  locale: string;
  token: string;
}

export function ResetPasswordForm({ locale, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/custom/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reset password");
      }

      router.push(`/${locale}/login?message=Password reset successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">New Password</label>
        <input
          {...register("password")}
          type="password"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.password && (
          <span className="text-red-500 text-sm">{errors.password.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Confirm Password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.confirmPassword && (
          <span className="text-red-500 text-sm">{errors.confirmPassword.message}</span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>

      <div className="text-center text-sm">
        <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  );
}