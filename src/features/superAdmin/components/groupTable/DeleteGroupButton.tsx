"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGroupAction } from "@/lib/groups/server/groups.actions";

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  className?: string;
}

export function DeleteGroupButton({ groupId, groupName, memberCount, className }: DeleteGroupButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const message =
      memberCount > 0
        ? `Supprimer « ${groupName} » ? Les ${memberCount} membre${memberCount > 1 ? "s" : ""}, administrateur compris, passeront en forfait individuel.`
        : `Supprimer « ${groupName} » ?`;
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
      aria-label={`Supprimer l'équipe ${groupName}`}
    >
      {isPending ? "Suppression…" : "Supprimer l'equipe"}
    </button>
  );
}