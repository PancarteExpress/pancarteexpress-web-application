"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteGroupAction } from "@/lib/groups/server/groups.actions";

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  className?: string;
}

export function DeleteGroupButton({ groupId, groupName, memberCount, className }: DeleteGroupButtonProps) {
  const router = useRouter();
  const t = useTranslations("superAdmin.deleteGroup");
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const message =
      memberCount > 0
        ? t("confirmWithMembers", { name: groupName, count: memberCount })
        : t("confirm", { name: groupName });
    if (!window.confirm(message)) return;

    startTransition(async () => {
      const result = await deleteGroupAction(groupId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={isPending}
      aria-label={t("ariaLabel", { name: groupName })}
    >
      {isPending ? t("deleting") : t("delete")}
    </button>
  );
}