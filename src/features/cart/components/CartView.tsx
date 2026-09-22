'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '../hooks/useCart';
import type {
  ProductCartItem as ProductItem,
  ServiceRequestCartItem as ServiceItem,
} from '../types/cart';
import ProductCartItem from './ProductCartItem';
import ServiceRequestCartItem from './ServiceRequestCartItem';
import CartSummary from './CartSummary';
import styles from './CartView.module.css';

export default function CartView() {
  const t = useTranslations('cart');
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const { items, hasHydrated, estimate, hasProducts, hasServices, updateQuantity, removeItem } = useCart();

  // Le serveur ne voit pas le localStorage : rien à afficher avant l'hydratation
  if (!hasHydrated) {
    return <div className={styles.skeleton} aria-busy="true" aria-label={t('loading')} />;
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t('title')}</h1>
        <div className={styles.empty}>
          <p>{t('emptyCart')}</p>
          <div className={styles.emptyActions}>
            <Link href={`/${locale}/services`} className={styles.link}>{t('goToServices')}</Link>
            <Link href={`/${locale}/shop`} className={styles.link}>{t('goToShop')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const products = items.filter((i): i is ProductItem => i.kind === 'product');
  const serviceRequests = items.filter((i): i is ServiceItem => i.kind === 'serviceRequest');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>

      <div className={styles.layout}>
        <div className={styles.list}>
          {products.length > 0 && (
            <section aria-labelledby="cart-products">
              <h2 id="cart-products" className={styles.sectionTitle}>{t('products')}</h2>
              <ul className={styles.items}>
                {products.map((item) => (
                  <li key={item.id}>
                    <ProductCartItem
                      item={item}
                      locale={locale}
                      onQuantityChange={(q) => updateQuantity(item.id, q)}
                      onRemove={() => removeItem(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {serviceRequests.length > 0 && (
            <section aria-labelledby="cart-services">
              <h2 id="cart-services" className={styles.sectionTitle}>{t('serviceRequests')}</h2>
              <ul className={styles.items}>
                {serviceRequests.map((item) => (
                  <li key={item.id}>
                    <ServiceRequestCartItem item={item} locale={locale} onRemove={() => removeItem(item.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <CartSummary estimate={estimate} hasProducts={hasProducts} hasServices={hasServices} locale={locale} />
      </div>
    </div>
  );
}