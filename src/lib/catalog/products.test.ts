import { describe, expect, it } from 'vitest';
import { PRODUCTS } from './products';
import fr from '../../../messages/fr/products.json';
import en from '../../../messages/en/products.json';

type Translations = Record<string, { name?: string }>;
const locales: Record<string, Translations> = { fr, en };

describe('catalogue produits', () => {
  it('a des slugs uniques', () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('a des slugs au bon format', () => {
    for (const { slug } of PRODUCTS) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('a des prix entiers et positifs (cents)', () => {
    for (const { slug, price } of PRODUCTS) {
      expect(Number.isInteger(price) && price > 0, slug).toBe(true);
    }
  });

  it.each(Object.keys(locales))('a un nom pour chaque produit en %s', (locale) => {
    for (const { slug } of PRODUCTS) {
      expect(locales[locale][slug]?.name?.trim(), `${locale} : ${slug}`).toBeTruthy();
    }
  });

  it.each(Object.keys(locales))("n'a pas de traduction orpheline en %s", (locale) => {
    const slugs = new Set(PRODUCTS.map((p) => p.slug));
    for (const key of Object.keys(locales[locale])) {
      expect(slugs.has(key), `${locale} : ${key}`).toBe(true);
    }
  });
});