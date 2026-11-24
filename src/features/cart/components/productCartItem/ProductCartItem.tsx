'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TiDeleteOutline } from 'react-icons/ti';
import { formatCents } from '@/lib/pricing/money';
import { getProductBySlug } from '@/lib/catalog/catalog';
import type { ProductCartItem as ProductCartItemType } from '../../types/cart';
import QuantityStepper from '../quantityStepper/QuantityStepper';
import styles from './ProductCartItem.module.css';

interface Props {
  item: ProductCartItemType;
  locale: 'fr' | 'en';
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export default function ProductCartItem({ item, locale, onQuantityChange, onRemove }: Props) {
  const t = useTranslations('cart');
  const name = locale === 'en' ? item.nameEn || item.nameFr : item.nameFr;

  // Prix et image actuels du catalogue, comme au checkout ; undefined si le produit est retiré ou désactivé
  const product = getProductBySlug(item.productId);
  const imageUrl = product?.image ?? item.imageUrl;

  return (
    <article className={`${styles.row} ${product ? '' : styles.unavailableRow}`}>
      <div className={styles.image}>
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="72px" style={{ objectFit: 'contain' }} />
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </div>

      <div>
        <p className={styles.name}>{name}</p>
        {product ? (
          <p className={styles.unit}>{t('unitPrice', { price: formatCents(product.price, locale) })}</p>
        ) : (
          <p className={styles.unavailable} role="alert">{t('productUnavailable')}</p>
        )}
      </div>

      {product ? (
        <QuantityStepper value={item.quantity} onChange={onQuantityChange} label={t('quantityOf', { name })} />
      ) : (
        <span aria-hidden="true" />
      )}

      <p className={styles.lineTotal}>{product ? formatCents(product.price * item.quantity, locale) : '—'}</p>

      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={t('removeProduct', { name })}
      >
        <TiDeleteOutline size={22} aria-hidden="true" />
      </button>
    </article>
  );
}