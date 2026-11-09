import 'server-only';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';


type EmailLocale = 'fr' | 'en';

export interface ServiceBlockRecipient {
  email: string;
  firstName: string | null;
  /** Admin d'un groupe en facturation GROUP : son blocage s'étend à toute l'équipe */
  blocksTeam: boolean;
}

interface Template {
  subject: string;
  title: string;
  lines: string[];
}

const TEAM_NOTE = {
  fr: "Les membres de votre équipe ne pourront pas non plus faire de demandes de service, puisque leurs factures vous sont adressées.",
  en: 'Your team members will not be able to submit service requests either, since their invoices are billed to you.',
} satisfies Record<EmailLocale, string>;

const formatDeadline = (date: Date, locale: EmailLocale) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-CA' : 'fr-CA', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(date);

const greeting = (firstName: string | null, locale: EmailLocale) =>
  locale === 'en' ? `Hello${firstName ? ` ${firstName}` : ''},` : `Bonjour${firstName ? ` ${firstName}` : ''},`;

const accountingLine = (locale: EmailLocale) =>
  locale === 'en'
    ? `To settle your account, contact our accounting department: ${CONTACT.accountingPhone} · ${CONTACT.accountingEmail}`
    : `Pour régler votre compte, communiquez avec notre comptabilité : ${CONTACT.accountingPhone} · ${CONTACT.accountingEmail}`;

const TEMPLATES = {
  warning: {
    fr: (deadline: string): Template => ({
      subject: 'Avis de facture en souffrance | Pancarte Express',
      title: 'Facture en souffrance',
      lines: [
        'Votre compte présente une ou plusieurs factures en souffrance.',
        `Sans paiement avant le ${deadline}, vos demandes de service seront bloquées jusqu'au règlement complet.`,
      ],
    }),
    en: (deadline: string): Template => ({
      subject: 'Overdue invoice notice | Pancarte Express',
      title: 'Overdue invoice',
      lines: [
        'Your account has one or more overdue invoices.',
        `Without payment before ${deadline}, your service requests will be blocked until your account is fully settled.`,
      ],
    }),
  },
  blocked: {
    fr: (): Template => ({
      subject: 'Demandes de service bloquées | Pancarte Express',
      title: 'Demandes de service bloquées',
      lines: [
        "Le délai de paiement de vos factures en souffrance est expiré.",
        "Vos demandes de service sont maintenant bloquées. Elles seront de nouveau possibles dès le règlement de votre compte.",
      ],
    }),
    en: (): Template => ({
      subject: 'Service requests blocked | Pancarte Express',
      title: 'Service requests blocked',
      lines: [
        'The payment deadline for your overdue invoices has passed.',
        'Your service requests are now blocked. They will be available again as soon as your account is settled.',
      ],
    }),
  },
  unblocked: {
    fr: (): Template => ({
      subject: 'Demandes de service rétablies | Pancarte Express',
      title: 'Votre compte est en règle',
      lines: [
        'Merci pour votre paiement.',
        'Vos demandes de service sont de nouveau possibles dès maintenant depuis votre tableau de bord.',
      ],
    }),
    en: (): Template => ({
      subject: 'Service requests restored | Pancarte Express',
      title: 'Your account is in good standing',
      lines: [
        'Thank you for your payment.',
        'You can submit service requests again from your dashboard, starting now.',
      ],
    }),
  },
} satisfies Record<string, Record<EmailLocale, (...args: string[]) => Template>>;

async function send(recipient: ServiceBlockRecipient, template: Template, locale: EmailLocale, extra: string[][]) {
  const sections = [[greeting(recipient.firstName, locale)], template.lines, ...extra];
  await sendEmail({
    to: recipient.email,
    replyTo: CONTACT.accountingEmail, // une réponse arrive à la comptabilité
    subject: template.subject,
    text: [...sections, ['Pancarte Express', `${CONTACT.mainPhone} · ${CONTACT.infoEmail}`]]
      .map((lines) => lines.join('\n'))
      .join('\n\n'),
    html: await renderTextEmail({ title: template.title, sections, locale }),
  });
}

/** Au clic « Bloquer » : avertissement avec la date limite de paiement. Lève en cas d'échec. */
export function sendServiceBlockWarningEmail(recipient: ServiceBlockRecipient, startsAt: Date, locale: EmailLocale = 'fr') {
  const extra = [...(recipient.blocksTeam ? [[TEAM_NOTE[locale]]] : []), [accountingLine(locale)]];
  return send(recipient, TEMPLATES.warning[locale](formatDeadline(startsAt, locale)), locale, extra);
}

/** Quand le délai expire (cron) : blocage effectif. Lève en cas d'échec. */
export function sendServiceBlockedEmail(recipient: ServiceBlockRecipient, locale: EmailLocale = 'fr') {
  const extra = [...(recipient.blocksTeam ? [[TEAM_NOTE[locale]]] : []), [accountingLine(locale)]];
  return send(recipient, TEMPLATES.blocked[locale](), locale, extra);
}

/** Au clic « Débloquer » : demandes de nouveau possibles. Lève en cas d'échec. */
export function sendServiceUnblockedEmail(recipient: ServiceBlockRecipient, locale: EmailLocale = 'fr') {
  return send(recipient, TEMPLATES.unblocked[locale](), locale, []);
}

const NOTICE_BATCH = 50;

/**
 * Cron quotidien : courriel « blocage effectif » pour chaque délai expiré, une seule fois.
 * Un échec d'envoi laisse la date vide : le courriel est retenté au prochain passage.
 */
export async function notifyEffectiveServiceBlocks(now: Date = new Date()): Promise<number> {
  const users = await prisma.user.findMany({
    where: { serviceBlockStartsAt: { lte: now }, serviceBlockNoticeSentAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      locale: true,
      role: true,
      group: { select: { billingMode: true } },
    },
    take: NOTICE_BATCH,
  });

  let sent = 0;
  for (const user of users) {
    try {
      await sendServiceBlockedEmail({
        email: user.email,
        firstName: user.firstName,
        blocksTeam: user.role === 'groupAdmin' && user.group?.billingMode === 'GROUP',
      }, user.locale
    );
      // Conditionnel : si le superAdmin a débloqué entre-temps, rien à marquer
      await prisma.user.updateMany({
        where: { id: user.id, serviceBlockStartsAt: { lte: now } },
        data: { serviceBlockNoticeSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error('[service-block] Échec du courriel de blocage (retenté au prochain cron) :', user.id, err);
    }
  }
  return sent;
}
