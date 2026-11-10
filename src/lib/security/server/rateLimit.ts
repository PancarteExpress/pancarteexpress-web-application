import 'server-only';

/*
 * Limiteur de requêtes en mémoire, par fenêtre fixe.
 * Limite connue : en hébergement serverless, chaque instance a sa propre mémoire. La protection
 * freine donc la force brute sans la rendre impossible ; pour une limite globale, il faudrait un
 * stockage partagé (Redis, table en base).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** true si la requête est autorisée ; false si la limite est atteinte pour cette clé */
export function takeToken(key: string, { limit, windowMs }: { limit: number; windowMs: number }): boolean {
  const now = Date.now();

  // Évite une croissance sans fin de la mémoire : on purge les fenêtres expirées
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Adresse IP du client derrière le proxy (Vercel renseigne x-forwarded-for) */
export const clientIp = (req: Request): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
