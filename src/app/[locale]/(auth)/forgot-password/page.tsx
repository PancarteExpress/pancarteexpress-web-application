import { ForgotPasswordForm } from "@/features/auth/components/forgotPasswordForm/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
      <ForgotPasswordForm locale={locale} />
    </div>
  );
}