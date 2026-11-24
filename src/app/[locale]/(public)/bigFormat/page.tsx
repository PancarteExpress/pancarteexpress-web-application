import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import BigFormatView from '@/features/bigFormat/components/BigFormatView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('bigFormatTitle'),
    description: t('bigFormatDescription'),
    alternates: {
      canonical: `/${locale}/bigFormat`,
      languages: { fr: '/fr/bigFormat', en: '/en/bigFormat' },
    },
  };
}

export default function BigFormatPage() {
  return <BigFormatView />;
}