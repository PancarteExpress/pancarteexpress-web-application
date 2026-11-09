"use client";

import type { ChangeEvent } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { GroupStatus, UserRole } from "@prisma/client";
import {
  ACCOUNT_TYPES,
  getAccountType,
  isAccountType,
} from "@/lib/users/accountType";
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
  const t = useTranslations("superAdmin");
  const [isPending, startTransition] = useTransition();
  const current = getAccountType(role, groupStatus);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isAccountType(next)) return;

    const message =
      next === "groupAdmin"
        ? t("accountTypeSelect.confirmGroupAdmin", { name: userName })
        : t("accountTypeSelect.confirmChange", { name: userName, type: t(`accountTypes.${next}`) });
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
      aria-label={t("accountTypeSelect.ariaLabel", { name: userName })}
    >
      {current === "member" && (
        <option value="member" disabled>
          {t("accountTypes.member")}
        </option>
      )}
      {ACCOUNT_TYPES.map((type) => (
        <option key={type} value={type}>
          {t(`accountTypes.${type}`)}
        </option>
      ))}
    </select>
  );
}