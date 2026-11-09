"use client";

import styles from "./UpdateGroup.module.css";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { groupNameSchema, type GroupNameInput } from "@/lib/groups/groups.schema";
import type { BillingMode } from "@prisma/client";
import {
  renameGroupAction,
  addGroupMembersAction,
  removeGroupMemberAction,
  setBillingModeAction,
  type UserSearchResult,
} from "@/lib/groups/server/groups.actions";
import type { GroupDetails, GroupMember } from "@/lib/groups/server/groups.service";
import { MemberEmailSearch } from "../memberEmailSearch/MemberEmailSearch";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";

interface UpdateGroupProps {
  initialGroup: GroupDetails;
  onClose: () => void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

// Libellé et description : groups.manage.billingModes.<mode>
const BILLING_MODES = ["INDIVIDUAL", "GROUP"] as const satisfies readonly BillingMode[];

export default function UpdateGroup({ initialGroup, onClose }: UpdateGroupProps) {
  const router = useRouter();
  const t = useTranslations("groups");
  // Messages du schéma partagé et des actions : clés de groups.errors (texte libre affiché tel quel)
  const translateIssue = useIssueMessage("groups.errors");
  const translateError = (message: string) => translateIssue(message) ?? message;
  const { data: session, update } = useSession();
  const isGroupAdmin = session?.user?.role === "groupAdmin";

  const [group, setGroup] = useState<GroupDetails>(initialGroup);
  const [nameFeedback, setNameFeedback] = useState<Feedback>(null);
  const [membersFeedback, setMembersFeedback] = useState<Feedback>(null);
  const [toAdd, setToAdd] = useState<UserSearchResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [billingMode, setBillingMode] = useState<BillingMode>(initialGroup.billingMode);
  const [billingFeedback, setBillingFeedback] = useState<Feedback>(null);
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GroupNameInput>({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: initialGroup.name ?? "" },
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const onRename = async (values: GroupNameInput) => {
    setNameFeedback(null);
    try {
      const res = await renameGroupAction(values);
      if (!res.ok) {
        setNameFeedback({ type: "error", message: "errorKey" in res ? t(`errors.${res.errorKey}`) : translateError(res.error) });
        return;
      }
      setGroup(res.group);
      reset({ name: res.group.name ?? "" });
      setNameFeedback({ type: "success", message: t("manage.nameUpdated") });
      await update(); // rafraîchit groupName dans la session
      router.refresh(); // resynchronise les données serveur de la page
    } catch {
      setNameFeedback({ type: "error", message: t("manage.genericError") });
    }
  };

  const handleAdd = async () => {
    if (toAdd.length === 0) return;
    setIsAdding(true);
    setMembersFeedback(null);
    try {
      const res = await addGroupMembersAction({ memberIds: toAdd.map((u) => u.id) });
      if (!res.ok) {
        setMembersFeedback({ type: "error", message: translateError(res.error) });
        return;
      }
      setGroup(res.group);
      setMembersFeedback({ type: "success", message: t("manage.membersAdded", { count: toAdd.length }) });
      setToAdd([]);
      router.refresh();
    } catch {
      setMembersFeedback({ type: "error", message: t("manage.genericError") });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (member: GroupMember) => {
    if (!window.confirm(t("manage.confirmRemove", { email: member.email }))) return;
    setRemovingId(member.id);
    setMembersFeedback(null);
    try {
      const res = await removeGroupMemberAction(member.id);
      if (!res.ok) {
        setMembersFeedback({ type: "error", message: translateError(res.error) });
        return;
      }
      setGroup(res.group);
      router.refresh();
    } catch {
      setMembersFeedback({ type: "error", message: t("manage.genericError") });
    } finally {
      setRemovingId(null);
    }
  };

  const handleSaveBilling = async () => {
    setIsSavingBilling(true);
    setBillingFeedback(null);
    try {
      const res = await setBillingModeAction(billingMode);
      if (!res.ok) {
        setBillingFeedback({ type: "error", message: translateError(res.error) });
        return;
      }
      setGroup(res.group);
      setBillingMode(res.group.billingMode);
      setBillingFeedback({
        type: "success",
        message: t("manage.billingUpdated"),
      });
      router.refresh();
    } catch {
      setBillingFeedback({ type: "error", message: t("manage.genericError") });
    } finally {
      setIsSavingBilling(false);
    }
  };

  if (!isGroupAdmin) return null;

  return (
    <div className={styles.fixedContainer}>
      <div role="dialog" aria-modal="true" aria-labelledby="update-group-title" className={styles.mainContainer}>
        <div className={styles.header}>
          <h2 id="update-group-title">{t("manage.title")}</h2>
          <button type="button" onClick={onClose}>{t("manage.close")}</button>
        </div>

        <div className={styles.body}>
          {/* Nom */}
          <section className={styles.section}>
            <h3>{t("manage.teamName")}</h3>
            <form onSubmit={handleSubmit(onRename)} noValidate>
              <div className={styles.inputs}>
                <label htmlFor="group-name">{t("manage.name")}</label>
                <input id="group-name" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name?.message && <p className={styles.error}>{translateError(errors.name.message)}</p>}
              </div>
              {nameFeedback && (
                <p className={nameFeedback.type === "error" ? styles.error : styles.success}>
                  {nameFeedback.message}
                </p>
              )}
              <div className={styles.btnSave}>
                <button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting ? t("manage.saving") : t("manage.save")}
                </button>
              </div>
            </form>
          </section>

          {/* Facturation */}
          <section className={styles.section}>
            <h3>{t("manage.billing")}</h3>
            <fieldset className={styles.billingOptions} disabled={isSavingBilling}>
              <legend className={styles.membersLabel}>{t("manage.whoPays")}</legend>
              {BILLING_MODES.map((mode) => (
                <label
                  key={mode}
                  className={`${styles.billingOption} ${billingMode === mode ? styles.billingOptionSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="billingMode"
                    value={mode}
                    checked={billingMode === mode}
                    onChange={() => setBillingMode(mode)}
                  />
                  <span>
                    <span className={styles.memberName}>{t(`manage.billingModes.${mode}.label`)}</span>
                    <span className={styles.memberEmail}>{t(`manage.billingModes.${mode}.description`)}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {billingFeedback && (
              <p className={billingFeedback.type === "error" ? styles.error : styles.success}>
                {billingFeedback.message}
              </p>
            )}

            <div className={styles.btnSave}>
              <button
                type="button"
                onClick={handleSaveBilling}
                disabled={isSavingBilling || billingMode === group.billingMode}
              >
                {isSavingBilling ? t("manage.saving") : t("manage.save")}
              </button>
            </div>
          </section>

          {/* Membres */}
          <section className={styles.section}>
            <h3>{t("manage.membersCount", { count: group.users.length })}</h3>

            <div>
              <span className={styles.membersLabel}>{t("manage.admin")}</span>
              {group.users.filter(m => m.role === 'groupAdmin').map(member => (
              <div key={member.id} className={styles.adminRow}>
                  <div>
                      <p className={styles.memberName}>{member.firstName} {member.lastName}</p>
                      <p className={styles.memberEmail}>{member.email}</p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeAdmin}`}>{t("manage.admin")}</span>
              </div>
              ))}
            </div>

            <div>
              <span className={styles.membersLabel}>{t("manage.members")}</span>
              <div className={styles.memberListWrap}>
                  <ul className={styles.memberList}>
                      {group.users.filter(m => m.role !== 'groupAdmin').map(member => (
                          <li key={member.id} className={styles.memberRow}>
                              <div>
                                  <p className={styles.memberName}>{member.firstName} {member.lastName}</p>
                                  <p className={styles.memberEmail}>{member.email}</p>
                              </div>
                              <span className={`${styles.badge} ${member.groupStatus === 'PENDING' ? styles.badgePending : styles.badgeActive}`}>
                                  {t(`manage.statuses.${member.groupStatus}`)}
                              </span>
                              <button type="button" className={styles.btnRemove} onClick={() => handleRemove(member)} disabled={removingId === member.id}>
                                  {removingId === member.id ? t("manage.removing") : t("manage.remove")}
                              </button>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>

            <MemberEmailSearch selected={toAdd} onChange={setToAdd} />

            {membersFeedback && (
              <p className={membersFeedback.type === "error" ? styles.error : styles.success}>
                {membersFeedback.message}
              </p>
            )}

            <div className={styles.btnSave}>
              <button type="button" onClick={handleAdd} disabled={isAdding || toAdd.length === 0}>
                {isAdding ? t("manage.adding") : t("manage.add", { count: toAdd.length })}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}