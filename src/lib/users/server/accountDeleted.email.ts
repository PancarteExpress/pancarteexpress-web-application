import 'server-only';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';

type EmailLocale = 'fr' | 'en';

const TEMPLATES = {
  fr: {
    subject: 'Fermeture de votre compte | Pancarte Express',
    title: 'Au revoir',
    greeting: (firstName: string | null) => `Bonjour${firstName ? ` ${firstName}` : ''},`,
    lines: [
      'Votre compte Pancarte Express a été supprimé. Vous ne pouvez plus vous y connecter ni faire de demandes de service.',
      'Vos commandes passées restent conservées pour nos dossiers comptables.',
      'Merci de nous avoir fait confiance.',
    ],
    contact: `Pour toute question, ou pour ouvrir un nouveau compte, communiquez avec nous : ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
  },
  en: {
    subject: 'Your account has been closed | Pancarte Express',
    title: 'Goodbye',
    greeting: (firstName: string | null) => `Hello${firstName ? ` ${firstName}` : ''},`,
    lines: [
      'Your Pancarte Express account has been deleted. You can no longer sign in or submit service requests.',
      'Your past orders are kept for our accounting records.',
      'Thank you for your trust.',
    ],
    contact: `For any question, or to open a new account, contact us: ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
  },
} satisfies Record<EmailLocale, unknown>;

/** Au revoir après la suppression du compte par le superAdmin. Lève en cas d'échec. */
export async function sendAccountDeletedEmail(email: string, firstName: string | null, locale: EmailLocale = 'fr') {
  const t = TEMPLATES[locale];
  const sections = [[t.greeting(firstName)], t.lines, [t.contact]];
  await sendEmail({
    to: email,
    replyTo: INTERNAL_EMAIL,
    subject: t.subject,
    text: [...sections, ['Pancarte Express']].map((lines) => lines.join('\n')).join('\n\n'),
    html: await renderTextEmail({ title: t.title, sections, locale }),
  });
}
