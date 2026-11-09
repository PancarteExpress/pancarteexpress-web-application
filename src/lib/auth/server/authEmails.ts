//import nodemailer from "nodemailer";
export type EmailLocale = "fr" | "en";

import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { CONTACT } from '@/shared/constants/contact';
import type { PickupCreateData } from '@/lib/auth/server/pickup';
import { createElement } from 'react';
import { render } from '@react-email/render';
import CodeEmail from '@/lib/email/templates/CodeEmail';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';

const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? 'https://pancarteexpress.com';

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
  pickupTitle: string;
  pickupAtAddress: (address: string) => string;
  pickupAtWarehouse: (warehouse: string, date: string | null) => string;
  pickupNotes: (notes: string) => string;
}

interface AccountCreatedInput {
  name: string;
  email: string;
  provider: AccountProvider;
  locale?: EmailLocale;
  groupStatus: 'SOLO' | 'PENDING';
  /** Absents à l'inscription Google (pas de formulaire) */
  phoneNumber?: string;
  companyName?: string;
  pickup?: PickupCreateData;
}

// Date seule (@db.Date, minuit UTC) : formatée en UTC pour ne pas reculer d'un jour
function formatReceptionDate(pickup: PickupCreateData, locale: EmailLocale): string | null {
  if (!pickup.receptionDate) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-CA' : 'fr-CA', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(pickup.receptionDate));
}

const formatPickupAddress = (pickup: PickupCreateData) =>
  [pickup.address, pickup.city, pickup.postalCode].filter(Boolean).join(', ');

/** Ramassage, côté interne (toujours en français) */
function pickupLines(pickup: PickupCreateData | undefined): string[] {
  if (!pickup) return [];
  if (pickup.mode === 'ADDRESS') {
    return [`Le client a choisi un ramassage de son matériel au ${formatPickupAddress(pickup)}.`];
  }
  const date = formatReceptionDate(pickup, 'fr');
  return [
    `Le client a choisi de nous apporter son matériel au ${CONTACT.address}${date ? `, le ${date}` : ''}.`,
    ...(pickup.notes ? [`Autres détails : ${pickup.notes}`] : []),
  ];
}

/** Ramassage, côté client (dans sa langue) */
function clientPickupLines(pickup: PickupCreateData | undefined, locale: EmailLocale): string[] {
  if (!pickup) return [];
  const t = WELCOME_TEMPLATES[locale];
  if (pickup.mode === 'ADDRESS') return [t.pickupAtAddress(formatPickupAddress(pickup))];
  return [
    t.pickupAtWarehouse(CONTACT.address, formatReceptionDate(pickup, locale)),
    ...(pickup.notes ? [t.pickupNotes(pickup.notes)] : []),
  ];
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
    pickupTitle: 'Votre matériel',
    pickupAtAddress: (address) => `Nous ramasserons votre matériel au ${address}.`,
    pickupAtWarehouse: (warehouse, date) => `Vous nous apporterez votre matériel au ${warehouse}${date ? `, le ${date}` : ''}.`,
    pickupNotes: (notes) => `Vos précisions : ${notes}`,
  },
  en: {
    subject: 'Welcome to Pancarte Express',
    greeting: (name) => `Hello ${name},`,
    body: 'Your account has been created. You can now submit service requests from your dashboard.',
    cta: 'Go to my dashboard',
    pickupTitle: 'Your materials',
    pickupAtAddress: (address) => `We will pick up your materials at ${address}.`,
    pickupAtWarehouse: (warehouse, date) => `You will bring your materials to ${warehouse}${date ? ` on ${date}` : ''}.`,
    pickupNotes: (notes) => `Your notes: ${notes}`,
  },
} satisfies Record<EmailLocale, WelcomeEmailTemplate>;

async function sendCodeEmail(to: string, code: string, t: CodeEmailTemplate, locale: EmailLocale): Promise<void> {
  const element = createElement(CodeEmail, { code, heading: t.heading, intro: t.intro, expiry: t.expiry, locale });
  await sendEmail({
    to,
    subject: t.subject,
    // Version texte : améliore la délivrabilité et sert de repli aux clients sans HTML
    text: `${t.intro} ${code}\n\n${t.expiry}`,
    html: await render(element),
  });
}

export function sendVerificationEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.verification[locale], locale);
}

export function sendPasswordResetEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.passwordReset[locale], locale);
}

/** Bienvenue au client, avec le récapitulatif du ramassage. Ne lève jamais : un échec est journalisé. */
async function sendWelcomeEmail(
  name: string,
  email: string,
  locale: EmailLocale,
  pickup: PickupCreateData | undefined,
): Promise<void> {
  const t = WELCOME_TEMPLATES[locale];
  const dashboardUrl = `${NEXTAUTH_URL}/${locale}/dashboard`;
  const pickupDetails = clientPickupLines(pickup, locale);
  const pickupText = pickupDetails.length > 0 ? `${t.pickupTitle}\n${pickupDetails.join('\n')}\n\n` : '';
  try {
    await sendEmail({
      to: email,
      replyTo: INTERNAL_EMAIL,
      subject: t.subject,
      text: `${t.greeting(name)}\n\n${t.body}\n\n${pickupText}${t.cta} : ${dashboardUrl}\n\nPancarte Express\n${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
      // React échappe les données insérées (un nom Google peut contenir n'importe quoi)
      html: await render(
        createElement(WelcomeEmail, {
          greeting: t.greeting(name),
          body: t.body,
          cta: t.cta,
          dashboardUrl,
          locale,
          pickupTitle: t.pickupTitle,
          pickupDetails,
        }),
      ),
    });
  } catch (err) {
    console.error('Erreur email création de compte (client) :', err);
  }
}

/**
 * Notification interne d'un nouveau compte, avec les infos du formulaire (toujours en français).
 * Ne lève jamais : un échec est journalisé.
 */
export async function sendNewAccountNotification({
  name,
  email,
  provider,
  locale = 'fr',
  groupStatus,
  phoneNumber,
  companyName,
  pickup,
}: AccountCreatedInput): Promise<void> {
  const sections = [
    [
      `Nom : ${name}`,
      `Courriel : ${email}`,
      ...(phoneNumber ? [`Téléphone : ${phoneNumber}`] : []),
      `Entreprise : ${companyName || '—'}`,
    ],
    [
      `Forfait : ${groupStatus === 'PENDING' ? "Groupe (en attente d'ajout à une équipe)" : 'Solo'}`,
      `Méthode : ${provider === 'google' ? 'Google' : 'Courriel / mot de passe'}`,
      `Langue : ${locale}`,
    ],
    pickupLines(pickup),
  ].filter((section) => section.length > 0);

  try {
    await sendEmail({
      to: INTERNAL_EMAIL,
      replyTo: email,
      subject: `[Nouveau compte] ${name}`,
      text: sections.map((lines) => lines.join('\n')).join('\n\n'),
      html: await renderTextEmail({ title: 'Nouveau compte', sections, locale: 'fr' }),
    });
  } catch (err) {
    console.error('Erreur email création de compte (interne) :', err);
  }
}

/**
 * Bienvenue au client et notification interne, une fois le ramassage connu :
 * à l'inscription par formulaire, ou après /complete-profile pour une inscription Google.
 * Ne lève jamais d'erreur : le compte est déjà créé, un échec d'email ne doit pas bloquer l'inscription.
 */
export async function sendAccountCreatedEmails(input: AccountCreatedInput): Promise<void> {
  await Promise.all([
    sendWelcomeEmail(input.name, input.email, input.locale ?? 'fr', input.pickup),
    sendNewAccountNotification(input),
  ]);
}
