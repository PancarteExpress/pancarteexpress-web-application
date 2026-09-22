import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CartView from '@/features/cart/components/CartView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title') };
}

export default function CartPage() {
  return <CartView />;
}