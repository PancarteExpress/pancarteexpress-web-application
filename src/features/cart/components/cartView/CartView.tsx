'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '../../hooks/useCart';
import type {
  ProductCartItem as ProductItem,
  ServiceRequestCartItem as ServiceItem,
} from '../../types/cart';
import ProductCartItem from '../productCartItem/ProductCartItem';
import ServiceRequestCartItem from '../serviceRequestCartItem/ServiceRequestCartItem';
import CartSummary from '../cartSummary/CartSummary';
import styles from './CartView.module.css';

export default function CartView() {
  const t = useTranslations('cart');
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const { items, hasHydrated, estimate, hasServices, updateQuantity, removeItem } = useCart();

  // Le serveur ne voit pas le localStorage : rien à afficher avant l'hydratation
  if (!hasHydrated) {
    return <div className={styles.skeleton} aria-busy="true" aria-label={t('loading')} />;
  }

  const products = items.filter((i): i is ProductItem => i.kind === 'product');
  const serviceRequests = items.filter((i): i is ServiceItem => i.kind === 'serviceRequest');

  return (<>

    <div className={styles.mainContainer}>
      {items.length === 0 && 
      <div className={styles.empty}>
        <label>Votre panier est vide</label>

        <div className={styles.redirections}>
          <Link href={`/${locale}/shop`} className={styles.link}>{t('goToShop')}</Link>
          <Link href={`/${locale}/services`} className={styles.link}>{t('goToServices')}</Link>
        </div>
      </div>
      }
      
      {items.length !== 0 && <>
      <div className={styles.cartItems}>

        {products.length > 0 &&
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
        }

        {serviceRequests.length > 0 && 
        <ul className={styles.items}>
          {serviceRequests.map((item) => (
            <li key={item.id}>
              <ServiceRequestCartItem item={item} locale={locale} onRemove={() => removeItem(item.id)} />
            </li>
          ))}
        </ul>
        }

      </div>
      
      <div className={styles.checkout}>
        <CartSummary estimate={estimate} hasServices={hasServices} locale={locale} />
      </div>
      </>}
    </div>
   
    
  </>);
}