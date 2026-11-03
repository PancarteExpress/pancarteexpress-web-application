'use server';

import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
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

  try {
    // Seul destinataire : l'équipe (INTERNAL_EMAIL) ; le visiteur n'est qu'en replyTo
    await sendEmail({
      to: INTERNAL_EMAIL,
      replyTo: enLigne(email),
      subject: `[Demande de contact] ${enLigne(firstName)} ${enLigne(lastName)}`,
      text: [
        `Nom : ${firstName} ${lastName}`,
        `Téléphone : ${phoneNumber}${extension ? ` poste ${extension}` : ''}`,
        `Courriel : ${email}`,
        `Entreprise : ${company || '—'}`,
        '',
        'Raison :',
        reason,
      ].join('\n'),
    });

    return { success: true };
  } catch (err) {
    console.error('Erreur envoi courriel :', err);
    return { success: false, error: "L'envoi a échoué, réessayez plus tard" };
  }
}