import type { CategorySlug } from './categories';
import { PRODUCTS, type Product } from './products';

export function getActiveProducts(category?: CategorySlug): Product[] {
  return PRODUCTS.filter((p) => p.isActive && (!category || p.categories.includes(category)));
}

/** Produit actif uniquement : un produit désactivé n'a plus de page et ne peut plus être commandé */
export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug && p.isActive);
}