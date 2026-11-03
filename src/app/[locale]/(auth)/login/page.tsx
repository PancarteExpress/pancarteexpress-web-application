import LoginView from "@/features/auth/components/loginView/LoginView";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LoginView locale={locale} />;
}