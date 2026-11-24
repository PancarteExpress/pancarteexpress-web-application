import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactView from '@/features/contact/components/ContactView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { fr: '/fr/contact', en: '/en/contact' },
    },
  };
}

export default function ContactPage() {
  return <ContactView />;
}