"use client";

import { ResetPasswordForm } from "@/features/auth/components/resetPasswordForm/ResetPasswordForm";
import { useSearchParams, usePathname } from "next/navigation";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <p className="text-red-500">Invalid or missing reset token</p>
        <button
          onClick={() => window.location.href = `/${locale}/login`}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      <ResetPasswordForm locale={locale} token={token} />
    </div>
  );
}