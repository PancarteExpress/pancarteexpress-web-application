import 'server-only';
import type { BillingMode } from '@prisma/client';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import type { CurrentAccountType } from '@/lib/users/accountType';

export interface AccountTypeChange {
  email: string;
  firstName: string | null;
  locale: 'fr' | 'en';
  to: CurrentAccountType;
  /** Équipe rejointe (member, groupAdmin promu) ou quittée (solo, pending) ; null = sans nom */
  groupName?: string | null;
  /** Équipe rejointe : qui reçoit les factures */
  billingMode?: BillingMode;
  /** L'équipe a été supprimée (et non quittée) */
  groupDeleted?: boolean;
}

type Locale = AccountTypeChange['locale'];
type Content = { title: string; lines: string[] };

/** « l'équipe X » / « the X team », ou « votre équipe » quand elle n'a pas de nom */
const team = (name: string | null | undefined, locale: Locale) =>
  locale === 'en' ? (name ? `the ${name} team` : 'your team') : name ? `l'équipe ${name}` : 'votre équipe';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const TEXT = {
  fr: {
    greeting: (firstName: string | null) => `Bonjour${firstName ? ` ${firstName}` : ''},`,
    contact: `Pour toute question : ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
    adminTitle: 'Vous êtes administrateur de groupe',
    adminOfTeam: (t: string) => `Vous êtes maintenant l'administrateur de ${t}.`,
    adminManage: 'Depuis votre tableau de bord, vous gérez les membres de votre équipe et le mode de facturation des demandes de service.',
    adminNew: 'Votre compte est maintenant un compte administrateur de groupe.',
    adminSetup: 'Depuis votre tableau de bord, nommez votre équipe, ajoutez vos coéquipiers par courriel et choisissez qui paie les demandes de service.',
    memberTitle: (t: string) => `Bienvenue dans ${t}`,
    memberJoined: (t: string) => `Vous faites maintenant partie de ${t}.`,
    billedToAdmin: "Les factures de vos demandes de service seront adressées à l'administrateur de l'équipe.",
    billedToSelf: 'Vous continuez de recevoir les factures de vos propres demandes de service.',
    pendingTitle: "Compte en attente d'une équipe",
    pendingBody: "Votre compte est en attente d'ajout à une équipe : l'administrateur de votre équipe peut maintenant vous ajouter à partir de votre adresse courriel.",
    soloTitle: 'Forfait individuel',
    left: (t: string) => `Vous ne faites plus partie de ${t}.`,
    deleted: (t: string) => `${capitalize(t)} a été supprimée.`,
    soloBody: 'Votre compte est maintenant en forfait individuel : les factures de vos demandes de service vous seront adressées directement.',
  },
  en: {
    greeting: (firstName: string | null) => `Hello${firstName ? ` ${firstName}` : ''},`,
    contact: `Questions? ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
    adminTitle: 'You are now a group administrator',
    adminOfTeam: (t: string) => `You are now the administrator of ${t}.`,
    adminManage: 'From your dashboard, you manage your team members and how service requests are billed.',
    adminNew: 'Your account is now a group administrator account.',
    adminSetup: 'From your dashboard, name your team, add your teammates by email and choose who pays for service requests.',
    memberTitle: (t: string) => `Welcome to ${t}`,
    memberJoined: (t: string) => `You are now part of ${t}.`,
    billedToAdmin: "Invoices for your service requests will be sent to the team's administrator.",
    billedToSelf: 'You will keep receiving the invoices for your own service requests.',
    pendingTitle: 'Account waiting for a team',
    pendingBody: 'Your account is waiting to be added to a team: your team administrator can now add you using your email address.',
    soloTitle: 'Individual plan',
    left: (t: string) => `You are no longer part of ${t}.`,
    deleted: (t: string) => `${capitalize(t)} has been deleted.`,
    soloBody: 'Your account is now on the individual plan: invoices for your service requests will be sent to you directly.',
  },
} satisfies Record<Locale, unknown>;

function content(change: AccountTypeChange): Content {
  const t = TEXT[change.locale];
  const groupTeam = team(change.groupName, change.locale);

  switch (change.to) {
    case 'groupAdmin':
      return change.groupName
        ? { title: t.adminTitle, lines: [t.adminOfTeam(groupTeam), t.adminManage] }
        : { title: t.adminTitle, lines: [t.adminNew, t.adminSetup] };
    case 'member':
      return {
        title: t.memberTitle(groupTeam),
        lines: [t.memberJoined(groupTeam), change.billingMode === 'GROUP' ? t.billedToAdmin : t.billedToSelf],
      };
    case 'pending':
      return {
        title: t.pendingTitle,
        lines: [...(change.groupName ? [t.left(groupTeam)] : []), t.pendingBody],
      };
    case 'solo':
      return {
        title: t.soloTitle,
        lines: [
          ...(change.groupDeleted ? [t.deleted(groupTeam)] : change.groupName ? [t.left(groupTeam)] : []),
          t.soloBody,
        ],
      };
  }
}

async function sendAccountTypeChangedEmail(change: AccountTypeChange): Promise<void> {
  const { title, lines } = content(change);
  const t = TEXT[change.locale];
  const sections = [[t.greeting(change.firstName)], lines, [t.contact]];
  await sendEmail({
    to: change.email,
    replyTo: INTERNAL_EMAIL,
    subject: `${title} | Pancarte Express`,
    text: [...sections, ['Pancarte Express']].map((l) => l.join('\n')).join('\n\n'),
    html: await renderTextEmail({ title, sections, locale: change.locale }),
  });
}

/**
 * Prévient chaque utilisateur dont le type de compte a changé. Ne lève jamais :
 * à appeler dans after(), une fois la modification validée ; un échec est journalisé.
 */
export async function notifyAccountTypeChanges(changes: readonly AccountTypeChange[]): Promise<void> {
  for (const change of changes) {
    try {
      await sendAccountTypeChangedEmail(change);
    } catch (err) {
      console.error('[account-type] Échec du courriel de changement de compte :', change.to, err);
    }
  }
}
