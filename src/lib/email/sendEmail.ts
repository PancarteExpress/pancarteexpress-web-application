// src/lib/email/sendEmail.ts
import 'server-only';
import path from 'node:path';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import { transporter } from './transporter';
import { LOGO_CID, LOGO_FILE } from './constants';

const FROM = process.env.SMTP_FROM ?? 'Pancarte Express <noreply@pancarteexpress.com>';

// Adresse interne qui reçoit les notifications (demandes de contact, nouveaux comptes, etc.)
export const INTERNAL_EMAIL = process.env.CONTACT_TO ?? 'pancarteexpress@gmail.com';

// Le `from` est imposé ici : aucun appelant ne peut envoyer depuis un autre domaine (protège la délivrabilité)
export type EmailOptions = Omit<SendMailOptions, 'from'>;

const LOGO_ATTACHMENT = { filename: 'logo.png', path: path.join(process.cwd(), LOGO_FILE), cid: LOGO_CID };

// Joint le logo seulement aux courriels HTML qui l'utilisent (EmailLayout)
function withLogo(options: EmailOptions): EmailOptions {
  if (typeof options.html !== 'string' || !options.html.includes(`cid:${LOGO_CID}`)) return options;
  return { ...options, attachments: [...(options.attachments ?? []), LOGO_ATTACHMENT] };
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // `from` après le spread : il ne peut jamais être écrasé, même à l'exécution
  const info = await transporter.sendMail({ ...withLogo(options), from: FROM });

  // En dev avec Ethereal : affiche le lien pour lire l'email (codes de vérification, etc.)
  if (process.env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('📬 Aperçu Ethereal :', previewUrl);
  }
}