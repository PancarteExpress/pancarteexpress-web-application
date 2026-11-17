import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RegisterView from "@/features/auth/components/registerView/RegisterView";
import RegisterPackages from "@/features/auth/components/registerPackages/RegisterPackages";
import { StorageOrderNotice } from '@/features/auth/components/registerView/StorageOrderNotice';

interface Props {
  params: Promise<{ locale: string }>;
  /** storageOrder : numéro de la commande d'un invité qui a demandé l'entreposage */
  searchParams: Promise<{ storageOrder?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  return { title: t('title') };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { storageOrder } = await searchParams;
  // Seul un numéro est accepté : le paramètre vient de l'URL
  const orderNumber = storageOrder && /^\d{1,9}$/.test(storageOrder) ? Number(storageOrder) : null;
  return (
    <RegisterView>
      {orderNumber !== null && <StorageOrderNotice locale={locale} orderNumber={orderNumber} />}
      <RegisterPackages locale={locale} />
    </RegisterView>
  );
}
