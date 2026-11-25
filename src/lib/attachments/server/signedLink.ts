import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/lib/siteUrl';

/*
 * Liens signés vers une pièce jointe, pour les courriels internes.
 * Ils s'ouvrent sans connexion tant que la signature est valide et non expirée ;
 * les fichiers restent privés dans Vercel Blob. Un lien modifié ou expiré exige la connexion superAdmin.
 */

/** Durée de validité d'un lien envoyé par courriel */
export const ATTACHMENT_LINK_TTL_DAYS = 30;

const DAY_SECONDS = 24 * 60 * 60;

function getSecret(): string | null {
  return process.env.ATTACHMENT_LINK_SECRET || null;
}

/** Signature de l'id et de la date d'expiration (secondes) */
const sign = (secret: string, id: string, exp: number): string =>
  createHmac('sha256', secret).update(`${id}.${exp}`).digest('base64url');

/** Lien complet (avec le domaine) à mettre dans un courriel */
export function attachmentLink(id: string, now: number = Date.now()): string {
  const base = `${SITE_URL}/api/attachments/${encodeURIComponent(id)}`;
  const secret = getSecret();
  // Sans clé : lien simple, qui demandera la connexion superAdmin (le courriel part quand même)
  if (!secret) {
    console.warn('[attachments] ATTACHMENT_LINK_SECRET absent : lien non signé');
    return base;
  }
  const exp = Math.floor(now / 1000) + ATTACHMENT_LINK_TTL_DAYS * DAY_SECONDS;
  return `${base}?exp=${exp}&sig=${sign(secret, id, exp)}`;
}

/** Vrai si exp et sig forment une signature valide et non expirée pour cet id */
export function isValidAttachmentSignature(
  id: string,
  exp: string | null,
  sig: string | null,
  now: number = Date.now(),
): boolean {
  const secret = getSecret();
  if (!secret || !exp || !sig || !/^\d{1,12}$/.test(exp)) return false;

  const expSeconds = Number(exp);
  if (expSeconds * 1000 <= now) return false;

  // Comparaison à temps constant : ne révèle pas, par la durée, combien de caractères sont bons
  const expected = Buffer.from(sign(secret, id, expSeconds));
  const received = Buffer.from(sig);
  return expected.length === received.length && timingSafeEqual(expected, received);
}