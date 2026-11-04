import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { formatCents } from '@/lib/pricing/money';
import type { Product } from '@/lib/catalog/products';
import type { Locale } from '@/shared/constants/locales';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import AddToCartButton from './AddToCartButton';
import styles from './Shop.module.css';

interface Props {
  product: Product;
  names: Record<Locale, string>;
}

export default function ProductCard({ product, names }: Props) {
  const t = useTranslations('shop');
  const locale = useAppLocale();
  const name = names[locale];

  return (
    <li className={styles.card}>
      <div className={styles.cardLink}>
        <div className={styles.imageContainer}>
          <Image
            src={product.image}
            alt={name}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 900px) 50vw, 33vw"
            style={{ objectFit: 'contain', objectPosition: 'top' }}
          />
        </div>
        <div className={styles.content}>
          <h3>{name}</h3>
          <p>{formatCents(product.price, locale)}</p>
        </div>
      </div>

      <AddToCartButton
        item={{
          productId: product.slug,
          nameFr: names.fr,
          nameEn: names.en,
          imageUrl: product.image,
          unitPrice: product.price,
        }}
        addLabel={t('addToCart', { name })}
        addedLabel={t('addedToCart', { name })}
      />
    </li>
  );
}