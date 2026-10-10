"use client";

import type { ChangeEvent } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GroupStatus, UserRole } from "@prisma/client";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  getAccountType,
  isAccountType,
} from "@/features/superAdmin/constants/accountType";
import { updateAccountTypeAction } from "@/lib/users/server/user.actions";

interface AccountTypeSelectProps {
  userId: string;
  userName: string;
  role: UserRole;
  groupStatus: GroupStatus;
  className?: string;
}

export function AccountTypeSelect({ userId, userName, role, groupStatus, className }: AccountTypeSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const current = getAccountType(role, groupStatus);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isAccountType(next)) return;

    const message =
      next === "groupAdmin"
        ? `Créer un nouveau groupe avec ${userName} comme administrateur ?`
        : `Passer ${userName} en « ${ACCOUNT_TYPE_LABELS[next]} » ?`;
    if (!window.confirm(message)) return;

    startTransition(async () => {
      const result = await updateAccountTypeAction(userId, next);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <select
      className={className}
      value={current}
      onChange={handleChange}
      disabled={isPending}
      aria-label={`Type de compte de ${userName}`}
    >
      {current === "member" && (
        <option value="member" disabled>
          {ACCOUNT_TYPE_LABELS.member}
        </option>
      )}
      {ACCOUNT_TYPES.map((type) => (
        <option key={type} value={type}>
          {ACCOUNT_TYPE_LABELS[type]}
        </option>
      ))}
    </select>
  );
}