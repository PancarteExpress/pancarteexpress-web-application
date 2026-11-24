import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomeView from '@/features/home/components/HomeView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('homeTitle'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: '/fr', en: '/en' },
    },
  };
}

export default function HomePage() {
  return <HomeView />;
}