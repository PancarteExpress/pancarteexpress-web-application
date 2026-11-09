'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import { contactSchema, type ContactFormData } from '../schemas/contact.schema';

export type SendContactResult =
  | { success: true }
  | { success: false; error: string };

// Retire les retours à la ligne des valeurs injectées dans les en-têtes du courriel
const enLigne = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export async function sendContact(data: ContactFormData): Promise<SendContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Données invalides' };
  }

  const { firstName, lastName, phoneNumber, extension, email, company, reason } = parsed.data;

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
    console.error('Erreur envoi courriel :', err);
    return { success: false, error: "L'envoi a échoué, réessayez plus tard" };
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
    console.error('Erreur envoi confirmation de contact :', err);
  }
}