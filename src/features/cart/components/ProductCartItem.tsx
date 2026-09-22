'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TiDeleteOutline } from 'react-icons/ti';
import { formatCents } from '@/lib/pricing/money';
import type { ProductCartItem as ProductCartItemType } from '../types/cart';
import QuantityStepper from './QuantityStepper';
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

  return (
    <article className={styles.row}>
      <div className={styles.image}>
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={name} fill sizes="72px" style={{ objectFit: 'contain' }} />
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </div>

      <div>
        <p className={styles.name}>{name}</p>
        <p className={styles.unit}>{t('unitPrice', { price: formatCents(item.unitPrice, locale) })}</p>
      </div>

      <QuantityStepper
        value={item.quantity}
        onChange={onQuantityChange}
        label={t('quantityOf', { name })}
      />

      <p className={styles.lineTotal}>{formatCents(item.unitPrice * item.quantity, locale)}</p>

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