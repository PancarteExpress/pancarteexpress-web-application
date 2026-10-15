// src/lib/email/transporter.ts
import 'server-only'; // empêche l'import côté client (protège les identifiants SMTP)
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // false sur 2525, la connexion passe en TLS via STARTTLS
  requireTLS: true, // refuse d'envoyer le mot de passe si le chiffrement échoue
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});