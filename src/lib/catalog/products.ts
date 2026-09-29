import type { CategorySlug } from './categories';

export interface Product {
  /** Identifiant permanent : ne jamais le modifier une fois en ligne */
  slug: string;
  /** Au moins une catégorie ; un produit peut en avoir plusieurs */
  categories: readonly [CategorySlug, ...CategorySlug[]];
  price: number; // cents
  image: `/shop/${string}`;
  isActive: boolean;
}

// Noms et descriptions : messages/{fr,en}/products.json, clé = slug
const PRODUCT_LIST = [
  // Boîtes à clés
  { slug: 'boites-a-cles', categories: ['keyboxes'], price: 2999, image: '/shop/keyboxes/keyboxes1.jpg', isActive: true },

  // Ancrages
  { slug: 'ancrage-metal-v', categories: ['anchors'], price: 2699, image: '/shop/anchors/anchors1.jpg', isActive: true },
  { slug: 'ancrage-metal-poteau-colonial', categories: ['anchors'], price: 2399, image: '/shop/anchors/anchors2.jpg', isActive: true },
  { slug: 'ancrage-metal-standard', categories: ['anchors'], price: 2699, image: '/shop/anchors/anchors3.jpg', isActive: true },
  { slug: 'ancrage-poteau-aluminium-engel-volkers', categories: ['anchors'], price: 3499, image: '/shop/anchors/anchors4.jpg', isActive: true },
  { slug: 'ensemble-poteau-plastique-35-ancrage', categories: ['poles', 'anchors'], price: 5999, image: '/shop/poles/poles1.jpg', isActive: true },
  { slug: 'ensemble-poteau-plastique-48-ancrage', categories: ['poles', 'anchors'], price: 6499, image: '/shop/poles/poles2.jpg', isActive: true },
  { slug: 'manchon-poteau-signalisation', categories: ['anchors', 'hardware'], price: 4499, image: '/shop/anchors/anchors7.jpg', isActive: true },
  { slug: 'tige-vissable-framd', categories: ['anchors'], price: 2499, image: '/shop/anchors/anchors8.jpg', isActive: true },
  { slug: 'tige-ancrage-framd', categories: ['anchors'], price: 1499, image: '/shop/anchors/anchors9.jpg', isActive: true },

  // Poteaux
  { slug: 'poteau-plastique-36-vis-nylon', categories: ['poles'], price: 3599, image: '/shop/poles/poles3.jpg', isActive: true },
  { slug: 'poteau-plastique-48-vis-nylon', categories: ['poles'], price: 4099, image: '/shop/poles/poles4.jpg', isActive: true },
  { slug: 'poteau-potence-colonial-ancrage', categories: ['poles'], price: 12499, image: '/shop/poles/poles5.jpg', isActive: true },
  { slug: 'poteau-potence-aluminium-ancrage', categories: ['poles'], price: 15499, image: '/shop/poles/poles6.jpg', isActive: true },
  { slug: 'poteau-potence-aluminium-engel-volkers-ancrage', categories: ['poles'], price: 15499, image: '/shop/poles/poles7.jpg', isActive: true },
  { slug: 'poteau-potence-plastique-ancrage', categories: ['poles'], price: 11999, image: '/shop/poles/poles8.jpg', isActive: true },
  { slug: 'poteau-signaletique-u-8-pieds', categories: ['poles'], price: 12499, image: '/shop/poles/poles9.jpg', isActive: true },

  // Quincaillerie
  { slug: 'attache-metal-c-clip', categories: ['hardware'], price: 99, image: '/shop/hardware/hardware1.jpg', isActive: true },
  { slug: 'attache-plastique-potence-colonial', categories: ['hardware'], price: 149, image: '/shop/hardware/hardware2.jpg', isActive: true },
  { slug: 'sachet-papillons-nylon', categories: ['hardware'], price: 2999, image: '/shop/hardware/hardware4.jpg', isActive: true },
  { slug: 'sachet-rondelles-nylon', categories: ['hardware'], price: 1349, image: '/shop/hardware/hardware5.jpg', isActive: true },
  { slug: 'sachet-vis-nylon', categories: ['hardware'], price: 4499, image: '/shop/hardware/hardware6.jpg', isActive: true },

  // Structures grand format
  { slug: 'structure-large-framd', categories: ['bigFormatStructure'], price: 188799, image: '/shop/bigFormatStructure/bigFormatStructure1.jpg', isActive: true },
  { slug: 'structure-mini-v-framd', categories: ['bigFormatStructure'], price: 133499, image: '/shop/bigFormatStructure/bigFormatStructure2.jpg', isActive: true },
  { slug: 'structure-mini-framd', categories: ['bigFormatStructure'], price: 102999, image: '/shop/bigFormatStructure/bigFormatStructure3.jpg', isActive: true },
  { slug: 'structure-standard-framd', categories: ['bigFormatStructure'], price: 151999, image: '/shop/bigFormatStructure/bigFormatStructure4.jpg', isActive: true },
  { slug: 'structure-standard-v-framd', categories: ['bigFormatStructure'], price: 222199, image: '/shop/bigFormatStructure/bigFormatStructure5.jpg', isActive: true },
  { slug: 'location-structure-large-framd', categories: ['bigFormatStructure'], price: 26499, image: '/shop/bigFormatStructure/bigFormatStructure6.jpg', isActive: true },
  { slug: 'location-structure-mini-framd', categories: ['bigFormatStructure'], price: 19999, image: '/shop/bigFormatStructure/bigFormatStructure7.jpg', isActive: true },
  { slug: 'location-structure-standard-framd', categories: ['bigFormatStructure'], price: 23499, image: '/shop/bigFormatStructure/bigFormatStructure8.jpg', isActive: true },
  { slug: 'location-structure-mini-v-framd', categories: ['bigFormatStructure'], price: 22499, image: '/shop/bigFormatStructure/bigFormatStructure9.jpg', isActive: true },
  { slug: 'location-structure-standard-v-framd', categories: ['bigFormatStructure'], price: 29999, image: '/shop/bigFormatStructure/bigFormatStructure10.jpg', isActive: true },
] as const satisfies readonly Product[];

export type ProductSlug = (typeof PRODUCT_LIST)[number]['slug'];

// Exposé avec le type large : évite que TypeScript fige chaque produit sur ses valeurs littérales
export const PRODUCTS: readonly Product[] = PRODUCT_LIST;