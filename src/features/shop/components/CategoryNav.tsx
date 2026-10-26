import { getLocale, getTranslations } from 'next-intl/server';
import { CATEGORY_SLUGS, type CategorySlug } from '@/lib/catalog/categories';
import styles from './Shop.module.css';
import Link from 'next/link';

interface Props {
  activeCategory: CategorySlug | null;
}

export default async function CategoryNav({ activeCategory }: Props) {
  const t = await getTranslations('shop');
  const locale = await getLocale();

  const options: { key: CategorySlug | 'all'; category: CategorySlug | null }[] = [
    { key: 'all', category: null },
    ...CATEGORY_SLUGS.map((slug) => ({ key: slug, category: slug })),
  ];

  return (
    <nav className={styles.navigation} aria-label={t('categoriesLabel')}>
      {options.map(({ key, category }) => (
        <Link
          key={key}
          href={category ? { pathname: `/${locale}/shop`, query: { category } } : `/${locale}/shop`}
          aria-current={activeCategory === category ? 'page' : undefined}
          scroll={false} // garde la position de défilement au changement de filtre
        >
          {t(`categories.${key}`)}
        </Link>
      ))}
    </nav>
  );
}