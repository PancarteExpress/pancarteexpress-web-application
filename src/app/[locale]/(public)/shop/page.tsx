import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { parseCategory } from '@/lib/catalog/categories';
import ShopView from '@/features/shop/components/ShopView';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const activeCategory = parseCategory((await searchParams).category);
  const t = await getTranslations({ locale, namespace: 'shop' });

  const path = activeCategory ? `/shop?category=${activeCategory}` : '/shop';

  return {
    title: activeCategory ? `${t(`categories.${activeCategory}`)} | ${t('title')}` : t('title'),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        fr: `/fr${path}`,
        en: `/en${path}`,
      },
    },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  // Catégorie inconnue dans l'URL : on affiche tout plutôt qu'une erreur
  const activeCategory = parseCategory((await searchParams).category);

  return <ShopView activeCategory={activeCategory} />;
}