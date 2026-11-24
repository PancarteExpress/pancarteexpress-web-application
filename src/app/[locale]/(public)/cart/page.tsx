import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CartView from '@/features/cart/components/cartView/CartView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return {
    title: t('heroTitle'),
    robots: { index: false, follow: false }, // page privée : pas dans les résultats de recherche
  };
}

export default function CartPage() {
  return <CartView />;
}