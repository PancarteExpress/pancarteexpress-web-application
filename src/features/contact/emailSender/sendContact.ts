'use server';

import nodemailer from 'nodemailer';
import { contactSchema, type ContactFormData } from '../types';

export type SendContactResult =
  | { success: true }
  | { success: false; error: string };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // false sur 2525, la connexion passe en TLS via STARTTLS
  requireTLS: true, // refuse d'envoyer le mot de passe si le chiffrement échoue
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendContact(data: ContactFormData): Promise<SendContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Données invalides' };
  }

  const { firstName, lastName, phoneNumber, extension, email, company, reason } = parsed.data;

  try {
    // Envoi de la requete à l'interne (pancarteexpress@gmail.com)
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: `[Demande de contact] ${firstName} ${lastName}`,
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

    // Confirmation au client : best-effort, son échec ne doit pas faire échouer la demande
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        replyTo: process.env.CONTACT_TO, // si le client répond, ça arrive dans pancarteexpress@gmail.com
        subject: 'Nous avons bien reçu votre demande | Pancarte Express',
        text: [
          `Bonjour ${firstName},`,
          '',
          'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.',
          '',
          'Pancarte Express',
          '514-825-2709 · info@pancarteexpress.com',
        ].join('\n'),
      });
    } catch (err) {
      console.error('Erreur confirmation client :', err);
    }

    return { success: true };
  } catch (err) {
    console.error('Erreur envoi courriel :', err);
    return { success: false, error: "L'envoi a échoué, réessayez plus tard" };
  }
}