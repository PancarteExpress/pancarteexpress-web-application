import RegisterView from "@/features/auth/components/registerView/RegisterView";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterView locale={locale} />;
}