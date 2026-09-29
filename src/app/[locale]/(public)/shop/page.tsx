import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isCategorySlug, type CategorySlug } from '@/lib/catalog/categories';
import ShopView from '@/features/shop/components/ShopView';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  return { title: t('title') };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;

  // Catégorie inconnue dans l'URL : on affiche tout plutôt qu'une erreur
  const raw = Array.isArray(category) ? category[0] : category;
  const activeCategory: CategorySlug | null = raw && isCategorySlug(raw) ? raw : null;

  return <ShopView locale={locale === 'en' ? 'en' : 'fr'} activeCategory={activeCategory} />;
}