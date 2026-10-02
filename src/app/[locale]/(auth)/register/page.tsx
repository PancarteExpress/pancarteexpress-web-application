import RegisterView from "@/features/auth/components/Register/RegisterView/RegisterView";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterView locale={locale} />;
}