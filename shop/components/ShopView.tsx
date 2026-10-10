import { getTranslations } from 'next-intl/server';
import { getActiveProducts } from '@/lib/catalog/catalog';
import type { CategorySlug } from '@/lib/catalog/categories';
import styles from './Shop.module.css';
import CategoryNav from './CategoryNav';
import ProductCard from './ProductCard';

interface Props {
  locale: 'fr' | 'en';
  activeCategory: CategorySlug | null;
}

export default async function ShopView({ locale, activeCategory }: Props) {
  const [t, tFr, tEn] = await Promise.all([
    getTranslations({ locale, namespace: 'shop' }),
    // Les deux langues : le panier garde le nom fr et en (affiché selon la langue courante)
    getTranslations({ locale: 'fr', namespace: 'products' }),
    getTranslations({ locale: 'en', namespace: 'products' }),
  ]);

  const products = getActiveProducts(activeCategory ?? undefined);

  return (
    <div className={styles.mainContainer}>

      <div className={styles.display}>
        <CategoryNav locale={locale} activeCategory={activeCategory} />

        <div className={styles.gridContainer}>
          {products.length === 0 ? (
            <p className={styles.empty}>{t('empty')}</p>
          ) : (
            <ul className={styles.grid}>
              {products.map((product) => {
                const nameFr = tFr(`${product.slug}.name`);
                const nameEn = tEn(`${product.slug}.name`);
                const name = locale === 'en' ? nameEn : nameFr;

                return (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    locale={locale}
                    name={name}
                    nameFr={nameFr}
                    nameEn={nameEn}
                    addLabel={t('addToCart', { name })}
                    addedLabel={t('addedToCart', { name })}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}