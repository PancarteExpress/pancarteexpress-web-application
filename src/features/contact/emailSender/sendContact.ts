'use server';

import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import { contactSchema, type ContactFormData } from '../schemas/contact.schema';

const MIN_FILL_MS = 3000; // un humain met plus de 3 s à remplir le formulaire
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 3; // envois permis par IP dans la fenêtre

export type SendContactResult =
  | { success: true }
  | { success: false; error: 'invalid' | 'rateLimited' | 'sendFailed' };

// Retire les retours à la ligne des valeurs injectées dans les en-têtes du courriel
const enLigne = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export async function sendContact(data: ContactFormData): Promise<SendContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'invalid' };
  }

  const { firstName, lastName, phoneNumber, extension, email, company, reason, website, elapsedMs } = parsed.data;

  // Robot probable : faux succès, rien n'est envoyé (il ne doit pas savoir qu'il est détecté)
  if (website || (elapsedMs !== undefined && elapsedMs < MIN_FILL_MS)) {
    console.warn('[contact] Envoi ignoré (anti-spam)');
    return { success: true };
  }

  try {
    if (await isRateLimited(await getIpHash())) {
      return { success: false, error: 'rateLimited' };
    }
  } catch (err) {
    // BD indisponible : on laisse passer plutôt que de bloquer un vrai client
    console.error('[contact] Vérification de la limite impossible :', err);
  }

  const sections = [
    [
      `Nom : ${firstName} ${lastName}`,
      `Téléphone : ${phoneNumber}${extension ? ` poste ${extension}` : ''}`,
      `Courriel : ${email}`,
      `Entreprise : ${company || '—'}`,
    ],
    ['Raison :', reason],
  ];

  try {
    // Seul destinataire : l'équipe (INTERNAL_EMAIL) ; le visiteur n'est qu'en replyTo
    await sendEmail({
      to: INTERNAL_EMAIL,
      replyTo: enLigne(email),
      subject: `[Demande de contact] ${enLigne(firstName)} ${enLigne(lastName)}`,
      text: sections.map((lines) => lines.join('\n')).join('\n\n'),
      html: await renderTextEmail({ title: 'Demande de contact', sections, locale: 'fr' }),
    });
  } catch (err) {
    console.error('[contact] Erreur envoi courriel :', err);
    return { success: false, error: 'sendFailed' };
  }

  // Seulement après l'envoi interne réussi : on ne confirme jamais une demande que l'équipe n'a pas reçue
  await sendConfirmation(enLigne(email));
  return { success: true };
}

/**
 * Accusé de réception au visiteur. Aucun texte saisi n'y est repris : l'adresse n'est pas vérifiée,
 * le formulaire ne doit pas servir à envoyer un contenu choisi par un tiers.
 * Un échec est seulement journalisé : l'équipe a déjà reçu la demande.
 */
async function sendConfirmation(to: string): Promise<void> {
  try {
    const locale = (await getLocale()) === 'en' ? 'en' : 'fr';
    const t = await getTranslations({ locale, namespace: 'contact.confirmationEmail' });
    const sections = [[t('greeting'), '', t('body')], [t('urgent', { phone: CONTACT.mainPhone })]];

    await sendEmail({
      to,
      replyTo: INTERNAL_EMAIL,
      subject: t('subject'),
      text: [...sections, ['Pancarte Express', `${CONTACT.mainPhone} · ${CONTACT.infoEmail}`]]
        .map((lines) => lines.join('\n'))
        .join('\n\n'),
      html: await renderTextEmail({ title: t('title'), sections, locale }),
    });
  } catch (err) {
    console.error('[contact] Erreur envoi confirmation :', err);
  }
}

/** IP du visiteur, hachée avec un sel : jamais stockée en clair */
async function getIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(`${ip}:${process.env.RATE_LIMIT_SALT ?? ''}`).digest('hex');
}

/** Vrai si l'IP a atteint la limite ; sinon, enregistre la tentative */
async function isRateLimited(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const count = await prisma.contactAttempt.count({ where: { ipHash, createdAt: { gte: since } } });
  if (count >= RATE_MAX) return true;
  await prisma.contactAttempt.create({ data: { ipHash } });
  return false;
}