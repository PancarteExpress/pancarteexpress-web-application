"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdGroups2 } from "react-icons/md";
import { groupNameSchema, type GroupNameInput } from "@/lib/groups/groups.schema";
import { renameGroupAction } from "@/lib/groups/server/groups.actions";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import styles from "./CreateGroupDialog.module.css";

interface Props {
  onCreated: () => Promise<unknown>;
}

export function CreateGroupDialog({ onCreated }: Props) {
  const t = useTranslations("groups");
  // Messages du schéma partagé et des actions : clés de groups.errors (texte libre affiché tel quel)
  const translateError = useIssueMessage("groups.errors");
  const [serverError, setServerError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupNameInput>({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: GroupNameInput) => {
    setServerError(null);
    const res = await renameGroupAction(values);  // ← Change ici, pas besoin de memberIds
    if (!res.ok) {
      setServerError("errorKey" in res ? t(`errors.${res.errorKey}`) : translateError(res.error) ?? null);
      return;
    }
    await onCreated();
  };


  return (
    <div className={styles.fixedContainer}>
      <div role="dialog" aria-modal="true" aria-labelledby="create-group-title" className={styles.mainContainer}>
        <div className={styles.header}>
          <MdGroups2 size={70} style={{ color: "#B6C9E1" }} />
          <h1 id="create-group-title">{t('createDialog.title')}</h1>
          <h3>{t('createDialog.subtitle')}</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="group-name">{t('createDialog.label')}</label>
          <input
            id="group-name"
            placeholder={t('createDialog.placeholder')}
            autoFocus
            {...register("name")}
            aria-invalid={!!errors.name}
          />

          {errors.name?.message && (
            <p role="alert" className={styles.error}>
              {translateError(errors.name.message)}
            </p>
          )}

          {serverError && (
            <p role="alert" className={styles.error}>
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('createDialog.creating') : t('createDialog.create')}
          </button>
        </form>
      </div>
    </div>
  );
}