import { getTranslations } from 'next-intl/server';
import { getActiveProducts } from '@/lib/catalog/catalog';
import type { CategorySlug } from '@/lib/catalog/categories';
import CategoryNav from './CategoryNav';
import ProductCard from './ProductCard';
import styles from './Shop.module.css';

interface Props {
  activeCategory: CategorySlug | null;
}

export default async function ShopView({ activeCategory }: Props) {
  const [t, tFr, tEn] = await Promise.all([
    getTranslations('shop'), // locale courante, déduite automatiquement
    // Les deux langues : le panier garde le nom fr et en
    getTranslations({ locale: 'fr', namespace: 'products' }),
    getTranslations({ locale: 'en', namespace: 'products' }),
  ]);

  const products = getActiveProducts(activeCategory ?? undefined);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.display}>
        <CategoryNav activeCategory={activeCategory} />

        <div className={styles.gridContainer}>
          {products.length === 0 ? (
            <p className={styles.empty}>{t('empty')}</p>
          ) : (
            <ul className={styles.grid}>
              {products.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  names={{
                    fr: tFr(`${product.slug}.name`),
                    en: tEn(`${product.slug}.name`),
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}