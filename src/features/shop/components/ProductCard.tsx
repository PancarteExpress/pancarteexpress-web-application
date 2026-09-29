import Image from 'next/image';
import Link from 'next/link';
import { formatCents } from '@/lib/pricing/money';
import type { Product } from '@/lib/catalog/products';
import styles from './Shop.module.css';
import AddToCartButton from './AddToCartButton';

interface Props {
  product: Product;
  locale: 'fr' | 'en';
  name: string;
  nameFr: string;
  nameEn: string;
  addLabel: string;
  addedLabel: string;
}

export default function ProductCard({ product, locale, name, nameFr, nameEn, addLabel, addedLabel }: Props) {
  return (
    <li className={styles.card}>
      {/* Le lien et le bouton sont frères : un bouton à l'intérieur d'un lien est invalide en HTML */}
      <Link href={`/${locale}/shop/${product.slug}`} className={styles.cardLink}>
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
      </Link>

      <AddToCartButton
        item={{ productId: product.slug, nameFr, nameEn, imageUrl: product.image, unitPrice: product.price }}
        addLabel={addLabel}
        addedLabel={addedLabel}
      />
    </li>
  );
}