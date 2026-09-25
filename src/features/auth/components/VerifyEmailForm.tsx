"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

interface VerifyEmailFormProps {
  locale: string;
  email: string;
  name: string;
  password: string;
  isGroup: boolean;
  groupName?: string;
}

export function VerifyEmailForm({
  locale,
  email,
  name,
  password,
  isGroup,
  groupName,
}: VerifyEmailFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("VerifyEmailForm locale:", locale);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: data.code,
          name,
          password,
          isGroup,
          groupName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }

      // Auto-login avec NextAuth
      const { signIn } = await import("next-auth/react");
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        throw new Error("Auto-login failed");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <p className="text-sm text-gray-600 mb-4">
          Un code à 6 chiffres a été envoyé à <strong>{email}</strong>
        </p>
        <label className="block text-sm font-medium mb-1">Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          {...register("code")}
          className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
          placeholder="000000"
          disabled={isLoading}
        />
        {errors.code && (
          <span className="text-red-600 text-sm">{errors.code.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
      >
        {isLoading ? "Vérification..." : "Vérifier"}
      </button>
    </form>
  );
}