import CheckoutView from '@/features/checkout/components/checkoutView/CheckoutView';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return {
    title: t('title'),
    robots: { index: false, follow: false }, // page privée : pas dans les résultats de recherche
  };
}

export default function CheckoutPage() {
  return <CheckoutView />;
}