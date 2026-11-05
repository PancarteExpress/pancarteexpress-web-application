import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RegisterView from "@/features/auth/components/registerView/RegisterView";
import RegisterPackages from "@/features/auth/components/registerPackages/RegisterPackages";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  return { title: t('title') };
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  return (
    <RegisterView>
      <RegisterPackages locale={locale} />
    </RegisterView>
  );
}
