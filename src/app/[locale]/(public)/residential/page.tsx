import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ResidentialView from '@/features/residential/components/ResidentialView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('residentialTitle'),
    description: t('residentialDescription'),
    alternates: {
      canonical: `/${locale}/residential`,
      languages: { fr: '/fr/residential', en: '/en/residential' },
    },
  };
}

export default function ResidentialPage() {
  return <ResidentialView />;
}