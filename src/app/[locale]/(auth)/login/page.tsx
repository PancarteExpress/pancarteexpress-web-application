import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginView from "@/features/auth/components/loginView/LoginView";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  return <LoginView locale={locale} />;
}