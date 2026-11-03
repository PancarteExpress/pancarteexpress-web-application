//import nodemailer from "nodemailer";
export type EmailLocale = "fr" | "en";

import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';

const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? 'https://pancarteexpress.com';

// Échappe les données utilisateur insérées dans du HTML (un nom Google peut contenir n'importe quoi)
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type AccountProvider = 'credentials' | 'google';

interface CodeEmailTemplate {
  subject: string;
  heading: string;
  intro: string;
  expiry: string;
}

interface WelcomeEmailTemplate {
  subject: string;
  greeting: (name: string) => string;
  body: string;
  cta: string;
}

interface AccountCreatedInput {
  name: string;
  email: string;
  provider: AccountProvider;
  locale?: EmailLocale;
}

const TEMPLATES = {
  verification: {
    fr: {
      subject: "Code de vérification - Pancarte Express",
      heading: "Vérifiez votre adresse courriel",
      intro: "Votre code de vérification est :",
      expiry: "Ce code expire dans 15 minutes.",
    },
    en: {
      subject: "Verification code - Pancarte Express",
      heading: "Verify your email address",
      intro: "Your verification code is:",
      expiry: "This code expires in 15 minutes.",
    },
  },
  passwordReset: {
    fr: {
      subject: "Réinitialisation du mot de passe - Pancarte Express",
      heading: "Réinitialisez votre mot de passe",
      intro: "Votre code de réinitialisation est :",
      expiry: "Ce code expire dans 15 minutes. Si vous n'avez pas fait cette demande, ignorez ce courriel.",
    },
    en: {
      subject: "Password reset - Pancarte Express",
      heading: "Reset your password",
      intro: "Your password reset code is:",
      expiry: "This code expires in 15 minutes. If you didn't request this, ignore this email.",
    },
  },
} satisfies Record<string, Record<EmailLocale, CodeEmailTemplate>>;

const WELCOME_TEMPLATES = {
  fr: {
    subject: 'Bienvenue chez Pancarte Express',
    greeting: (name) => `Bonjour ${name},`,
    body: 'Votre compte a bien été créé. Vous pouvez dès maintenant faire vos demandes de service depuis votre tableau de bord.',
    cta: 'Accéder à mon tableau de bord',
  },
  en: {
    subject: 'Welcome to Pancarte Express',
    greeting: (name) => `Hello ${name},`,
    body: 'Your account has been created. You can now submit service requests from your dashboard.',
    cta: 'Go to my dashboard',
  },
} satisfies Record<EmailLocale, WelcomeEmailTemplate>;

async function sendCodeEmail(to: string, code: string, t: CodeEmailTemplate): Promise<void> {
  await sendEmail({ 
    to,
    subject: t.subject,
    // Version texte : améliore la délivrabilité et sert de repli aux clients sans HTML
    text: `${t.intro} ${code}\n\n${t.expiry}`,
    html: `
      <h1>${t.heading}</h1>
      <p>${t.intro}</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>${t.expiry}</p>
    `,
  });
}

export function sendVerificationEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.verification[locale]);
}

export function sendPasswordResetEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.passwordReset[locale]);
}

/**
 * Envoie la bienvenue au client et la notification interne.
 * Ne lève jamais d'erreur : le compte est déjà créé, un échec d'email ne doit pas bloquer l'inscription.
 */
export async function sendAccountCreatedEmails({
  name,
  email,
  provider,
  locale = 'fr',
}: AccountCreatedInput): Promise<void> {
  const t = WELCOME_TEMPLATES[locale];
  const dashboardUrl = `${NEXTAUTH_URL}/${locale}/dashboard`;
  const safeName = escapeHtml(name);

  const results = await Promise.allSettled([
    // Bienvenue au client
    sendEmail({
      to: email,
      replyTo: INTERNAL_EMAIL,
      subject: t.subject,
      text: `${t.greeting(name)}\n\n${t.body}\n\n${t.cta} : ${dashboardUrl}\n\nPancarte Express\n514-825-2709 · info@pancarteexpress.com`,
      html: `
        <p>${t.greeting(safeName)}</p>
        <p>${t.body}</p>
        <p><a href="${dashboardUrl}" style="background:#0E4D9A;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">${t.cta}</a></p>
        <p>Pancarte Express<br>514-825-2709 · info@pancarteexpress.com</p>
      `,
    }),
    // Notification interne (toujours en français)
    sendEmail({
      to: INTERNAL_EMAIL,
      replyTo: email,
      subject: `[Nouveau compte] ${name}`,
      text: [
        `Nom : ${name}`,
        `Courriel : ${email}`,
        `Méthode : ${provider === 'google' ? 'Google' : 'Courriel / mot de passe'}`,
        `Langue : ${locale}`,
      ].join('\n'),
    }),
  ]);

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Erreur email création de compte (${i === 0 ? 'client' : 'interne'}) :`, r.reason);
    }
  });
}