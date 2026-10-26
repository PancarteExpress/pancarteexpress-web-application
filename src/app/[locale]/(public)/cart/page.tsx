import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CartView from '@/features/cart/components/cartView/CartView';

export default function CartPage() {
  return <CartView />;
}