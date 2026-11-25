import 'server-only';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export type RateLimitAction = 'contact' | 'register' | 'forgotPassword' | 'login' | 'orderLookup' | 'attachmentUpload';

interface Limit {
  max: number;
  windowMs: number;
}

const MINUTE = 60 * 1000;

/** Limites par action ; une même action peut être limitée par IP et par courriel */
export const LIMITS = {
  contactIp: { max: 3, windowMs: 10 * MINUTE },
  codeEmail: { max: 3, windowMs: 10 * MINUTE },
  codeIp: { max: 10, windowMs: 60 * MINUTE },
  loginIdentifier: { max: 10, windowMs: 15 * MINUTE },
  loginIp: { max: 30, windowMs: 15 * MINUTE },
  lookupIp: { max: 10, windowMs: 15 * MINUTE },
  lookupEmail: { max: 5, windowMs: 15 * MINUTE },
  uploadIp: { max: 30, windowMs: 15 * MINUTE },
} as const satisfies Record<string, Limit>;

/** Hachage salé : ni les IP ni les courriels ne sont stockés en clair */
const hash = (value: string) =>
  createHash('sha256').update(`${value}:${process.env.RATE_LIMIT_SALT ?? ''}`).digest('hex');

/** Clé de l'IP du visiteur (première IP de x-forwarded-for, fournie par Vercel) */
export async function ipKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return `ip:${hash(ip)}`;
}

/** Clé d'un courriel, insensible à la casse */
export const emailKey = (email: string) => `email:${hash(email.trim().toLowerCase())}`;

/**
 * Vrai si l'une des clés a atteint sa limite. Sinon, enregistre une tentative pour chaque clé.
 * BD indisponible : on laisse passer (fail-open) plutôt que de bloquer un vrai client.
 */
export async function isRateLimited(
  action: RateLimitAction,
  checks: { key: string; limit: Limit }[],
): Promise<boolean> {
  try {
    for (const { key, limit } of checks) {
      const since = new Date(Date.now() - limit.windowMs);
      const count = await prisma.rateLimitAttempt.count({ where: { action, key, createdAt: { gte: since } } });
      if (count >= limit.max) return true;
    }
    await prisma.rateLimitAttempt.createMany({ data: checks.map(({ key }) => ({ action, key })) });
    return false;
  } catch (err) {
    console.error(`[rate-limit] Vérification impossible (${action}) :`, err);
    return false;
  }
}

/** Supprime les tentatives plus vieilles que la plus longue fenêtre ; appelé par le cron */
export async function cleanupRateLimitAttempts(): Promise<number> {
  const { count } = await prisma.rateLimitAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * MINUTE) } },
  });
  return count;
}