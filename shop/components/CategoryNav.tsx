import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CATEGORY_SLUGS, type CategorySlug } from '@/lib/catalog/categories';
import styles from './Shop.module.css';

interface Props {
  locale: 'fr' | 'en';
  activeCategory: CategorySlug | null;
}

export default async function CategoryNav({ locale, activeCategory }: Props) {
  const t = await getTranslations({ locale, namespace: 'shop' });
  const base = `/${locale}/shop`;

  const options: { key: CategorySlug | 'all'; href: string; active: boolean }[] = [
    { key: 'all', href: base, active: activeCategory === null },
    ...CATEGORY_SLUGS.map((slug) => ({
      key: slug,
      href: `${base}?category=${slug}`,
      active: activeCategory === slug,
    })),
  ];

  return (
    <nav className={styles.navigation} aria-label={t('categoriesLabel')}>
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={option.active ? 'page' : undefined}
          scroll={false} // garde la position de défilement au changement de filtre
        >
          {t(`categories.${option.key}`)}
        </Link>
      ))}
    </nav>
  );
}