import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RegisterView from '@/features/auth/components/registerView/RegisterView';
import RegisterPackages from '@/features/auth/components/registerPackages/RegisterPackages';
import { StorageOrderNotice } from '@/features/auth/components/registerView/StorageOrderNotice';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/register`,
      languages: { fr: '/fr/register', en: '/en/register' },
    },
  };
}

export default function RegisterPage() {
  return (
    <RegisterView>
      <StorageOrderNotice />
      <RegisterPackages />
    </RegisterView>
  );
}