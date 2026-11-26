"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { respondToGroupInvitationAction } from "@/lib/groups/server/groups.actions";
import type { UserGroupInvitation } from "@/lib/groups/server/groups.service";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import styles from "./GroupInvitations.module.css";

interface Props {
  invitations: UserGroupInvitation[];
}

export function GroupInvitations({ invitations }: Props) {
  const t = useTranslations("dashboard.invitations");
  const tGroups = useTranslations("groups");
  const translateIssue = useIssueMessage("groups.errors");
  const locale = useLocale();
  const router = useRouter();
  const { update } = useSession();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const respond = async (invitation: UserGroupInvitation, accept: boolean) => {
    const teamName = invitation.group.name ?? t("unnamedTeam");
    if (!accept && !window.confirm(t("confirmDecline", { team: teamName }))) return;

    setPendingId(invitation.id);
    setError(null);
    try {
      const res = await respondToGroupInvitationAction({ invitationId: invitation.id, accept });
      if (!res.ok) {
        setError(translateIssue(res.error) ?? tGroups("manage.genericError"));
        router.refresh(); // invitation expirée ou annulée : la liste se met à jour
        return;
      }
      if (accept) await update(); // groupe et statut à jour dans la session (Header, bannière)
      router.refresh();
    } catch {
      setError(tGroups("manage.genericError"));
    } finally {
      setPendingId(null);
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
      dateStyle: "long",
      timeZone: "America/Toronto",
    }).format(date);

  return (
    <section className={styles.container} aria-labelledby="group-invitations-title">
      <h2 id="group-invitations-title" className={styles.title}>
        {t("title", { count: invitations.length })}
      </h2>

      <ul className={styles.list}>
        {invitations.map((invitation) => {
          const teamName = invitation.group.name ?? t("unnamedTeam");
          const isPending = pendingId === invitation.id;
          return (
            <li key={invitation.id} className={styles.item}>
              <div>
                <p className={styles.text}>{t("text", { team: teamName })}</p>
                <p className={styles.expires}>{t("expires", { date: formatDate(invitation.expiresAt) })}</p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.accept}
                  onClick={() => respond(invitation, true)}
                  disabled={pendingId !== null}
                >
                  {isPending ? t("processing") : t("accept")}
                </button>
                <button
                  type="button"
                  className={styles.decline}
                  onClick={() => respond(invitation, false)}
                  disabled={pendingId !== null}
                >
                  {t("decline")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  );
}