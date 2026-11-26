import 'server-only';
import { sendEmail, INTERNAL_EMAIL } from '@/lib/email/sendEmail';
import { renderTextEmail } from '@/lib/email/renderTextEmail';
import { CONTACT } from '@/shared/constants/contact';
import { SITE_URL } from '@/lib/siteUrl';

type Locale = 'fr' | 'en';

export type InvitationRecipient = { email: string; firstName: string | null; locale: Locale };

// Lien vers le tableau de bord, où l'invitation s'accepte ou se refuse
const dashboardUrl = (locale: Locale) => `${SITE_URL}/${locale}/dashboard`;

/** « l'équipe X » / « the X team », ou « une équipe » quand elle n'a pas de nom */
const team = (name: string | null, locale: Locale) =>
  locale === 'en' ? (name ? `the ${name} team` : 'a team') : name ? `l'équipe ${name}` : 'une équipe';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const personName = (p: { firstName: string | null; lastName: string | null; email: string }) => {
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
  return name ? `${name} (${p.email})` : p.email;
};

const TEXT = {
  fr: {
    greeting: (firstName: string | null) => `Bonjour${firstName ? ` ${firstName}` : ''},`,
    contact: `Pour toute question : ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
    inviteTitle: (t: string) => `Invitation à rejoindre ${t}`,
    inviteBody: (t: string) => `${capitalize(t)} vous invite à la rejoindre sur Pancarte Express.`,
    inviteAction: (url: string) => `Pour accepter ou refuser, connectez-vous à votre tableau de bord : ${url}`,
    inviteExpires: 'Cette invitation est valide 14 jours.',
    acceptedTitle: 'Invitation acceptée',
    acceptedBody: (who: string, t: string) => `${who} a accepté de rejoindre ${t}.`,
    declinedTitle: 'Invitation refusée',
    declinedBody: (who: string, t: string) => `${who} a refusé l'invitation à rejoindre ${t}.`,
    declinedAgain: 'Vous pouvez l\'inviter de nouveau depuis votre tableau de bord.',
  },
  en: {
    greeting: (firstName: string | null) => `Hello${firstName ? ` ${firstName}` : ''},`,
    contact: `Questions? ${CONTACT.mainPhone} · ${CONTACT.infoEmail}`,
    inviteTitle: (t: string) => `Invitation to join ${t}`,
    inviteBody: (t: string) => `${capitalize(t)} has invited you to join on Pancarte Express.`,
    inviteAction: (url: string) => `To accept or decline, sign in to your dashboard: ${url}`,
    inviteExpires: 'This invitation is valid for 14 days.',
    acceptedTitle: 'Invitation accepted',
    acceptedBody: (who: string, t: string) => `${who} has accepted to join ${t}.`,
    declinedTitle: 'Invitation declined',
    declinedBody: (who: string, t: string) => `${who} has declined the invitation to join ${t}.`,
    declinedAgain: 'You can invite them again from your dashboard.',
  },
} satisfies Record<Locale, unknown>;

async function send(to: InvitationRecipient, title: string, lines: string[]): Promise<void> {
  const t = TEXT[to.locale];
  const sections = [[t.greeting(to.firstName)], lines, [t.contact]];
  await sendEmail({
    to: to.email,
    replyTo: INTERNAL_EMAIL,
    subject: `${title} | Pancarte Express`,
    text: [...sections, ['Pancarte Express']].map((l) => l.join('\n')).join('\n\n'),
    html: await renderTextEmail({ title, sections, locale: to.locale }),
  });
}

/** Courriel « L'équipe X vous invite » à chaque invité. Ne lève jamais (à appeler dans after()). */
export async function sendGroupInvitationEmails(
  invitees: readonly InvitationRecipient[],
  groupName: string | null,
): Promise<void> {
  for (const invitee of invitees) {
    const t = TEXT[invitee.locale];
    const groupTeam = team(groupName, invitee.locale);
    try {
      await send(invitee, t.inviteTitle(groupTeam), [
        t.inviteBody(groupTeam),
        t.inviteAction(dashboardUrl(invitee.locale)),
        t.inviteExpires,
      ]);
    } catch (err) {
      console.error('[group-invitation] Échec du courriel d\'invitation :', err);
    }
  }
}

/** Courriel au groupAdmin actuel : le membre a accepté ou refusé. Ne lève jamais (à appeler dans after()). */
export async function sendInvitationResponseEmail(params: {
  admin: InvitationRecipient;
  member: { email: string; firstName: string | null; lastName: string | null };
  groupName: string | null;
  accepted: boolean;
}): Promise<void> {
  const { admin, member, groupName, accepted } = params;
  const t = TEXT[admin.locale];
  const groupTeam = team(groupName, admin.locale);
  const who = personName(member);
  try {
    await send(
      admin,
      accepted ? t.acceptedTitle : t.declinedTitle,
      accepted ? [t.acceptedBody(who, groupTeam)] : [t.declinedBody(who, groupTeam), t.declinedAgain],
    );
  } catch (err) {
    console.error('[group-invitation] Échec du courriel de réponse :', err);
  }
}