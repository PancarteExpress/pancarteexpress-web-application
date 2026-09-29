// L'ordre du tableau est l'ordre d'affichage dans la boutique
export const CATEGORY_SLUGS = ['poles', 'anchors', 'keyboxes', 'hardware', 'bigFormatStructure'] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const isCategorySlug = (value: string): value is CategorySlug =>
  (CATEGORY_SLUGS as readonly string[]).includes(value);