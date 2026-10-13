'use server';

import nodemailer from 'nodemailer';
import { contactSchema, type ContactFormData } from '../types';

export type SendContactResult =
  | { success: true }
  | { success: false; error: string };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
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
    const info = await transporter.sendMail({
      from: `"Formulaire Pancarte Express" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: `Nouvelle demande de ${firstName} ${lastName}`,
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

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('Aperçu Ethereal :', previewUrl);

    return { success: true };
  } catch (err) {
    console.error('Erreur envoi courriel :', err);
    return { success: false, error: "L'envoi a échoué, réessayez plus tard" };
  }
}