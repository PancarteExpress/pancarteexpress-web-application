// src/lib/email/sendEmail.ts
import 'server-only';
import type { SendMailOptions } from 'nodemailer';
import { transporter } from './transporter';

const FROM = process.env.SMTP_FROM ?? 'Pancarte Express <noreply@pancarteexpress.com>';

// Adresse interne qui reçoit les notifications (demandes de contact, nouveaux comptes, etc.)
export const INTERNAL_EMAIL = process.env.CONTACT_TO ?? 'pancarteexpress@gmail.com';

// Le `from` est imposé ici : aucun appelant ne peut envoyer depuis un autre domaine (protège la délivrabilité)
export type EmailOptions = Omit<SendMailOptions, 'from'>;

export async function sendEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({ from: FROM, ...options });
}