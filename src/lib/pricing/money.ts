/** Convertit un prix décimal (ex. Prisma Decimal sérialisé) en cents entiers. */
export function toCents(amount: number | string): number {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Montant invalide : ${amount}`);
  }
  return Math.round(value * 100);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatCents(cents: number, locale: 'fr' | 'en' = 'fr'): string {
  const key = `${locale}-CA`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(key, { style: 'currency', currency: 'CAD' });
    formatters.set(key, formatter);
  }
  return formatter.format(cents / 100);
}