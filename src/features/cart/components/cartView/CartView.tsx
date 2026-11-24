'use client';

import styles from './CartView.module.css';
import { useTranslations } from 'next-intl';
import { useCart } from '../../hooks/useCart';
import type { ProductCartItem as ProductItem, ServiceRequestCartItem as ServiceItem } from '../../types/cart';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { LocalLink } from '@/shared/components/LocalLink';
import ProductCartItem from '../productCartItem/ProductCartItem';
import ServiceRequestCartItem from '../serviceRequestCartItem/ServiceRequestCartItem';
import CartSummary from '../cartSummary/CartSummary';

export default function CartView() {
  const t = useTranslations('cart');
  const locale = useAppLocale();
  const { items, hasHydrated, estimate, hasServices, unavailableProductIds, expiredServiceRequestIds, updateQuantity, removeItem } = useCart();

  // Le serveur ne voit pas le localStorage : rien à afficher avant l'hydratation
  if (!hasHydrated) {
    return <div className={styles.skeleton} role="status" aria-busy="true" aria-label={t('loading')} />;
  }

  const isEmpty = items.length === 0;
  const products = items.filter((i): i is ProductItem => i.kind === 'product');
  const serviceRequests = items.filter((i): i is ServiceItem => i.kind === 'serviceRequest');
  // Résidentiel et grand format dans le même panier : les délais ne concernent que le résidentiel
  const hasMixedRequestTypes =
    serviceRequests.some((r) => r.requestType === 'residential') &&
    serviceRequests.some((r) => r.requestType === 'commercial');

  return (
    <div className={styles.mainContainer}>
      <div className={styles.hero}>
        <h1>{t('heroTitle')}</h1>
        {isEmpty ? (
          <p>
            {t('heroLabel1')}
            <br />
            {t('heroLabel2')}
          </p>
        ) : (
          <p>{t('heroLabel3')}</p>
        )}
      </div>

      {isEmpty ? (
        <div className={styles.empty}>
          <h2>{t('heroEmptyCart')}</h2>
          <div className={styles.redirections}>
            <LocalLink href="/shop" className={styles.link}>{t('goToShop')}</LocalLink>
            <LocalLink href="/services" className={styles.link}>{t('goToServices')}</LocalLink>
          </div>
        </div>
      ) : (
        <div className={styles.cart}>
          <div className={styles.cartItems}>
            {products.length > 0 && (
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
            )}

            {hasMixedRequestTypes && <p role="note" className={styles.mixedNotice}>{t('delay.mixedNotice')}</p>}

            {serviceRequests.length > 0 && (
              <ul className={styles.items}>
                {serviceRequests.map((item) => (
                  <li key={item.id}>
                    <ServiceRequestCartItem item={item} locale={locale} onRemove={() => removeItem(item.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.checkout}>
            <CartSummary
              estimate={estimate}
              hasServices={hasServices}
              hasUnavailable={unavailableProductIds.length > 0 || expiredServiceRequestIds.length > 0}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}