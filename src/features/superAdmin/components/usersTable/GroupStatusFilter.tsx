"use client";

import { useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { GROUP_STATUSES, type GroupStatusFilter as Filter } from "@/lib/users/adminUserFilters.schema";

interface GroupStatusFilterProps {
  value: Filter;
  className?: string;
}

export function GroupStatusFilter({ value, className }: GroupStatusFilterProps) {
  const router = useRouter();
  const t = useTranslations("superAdmin");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams); // conserve les autres paramètres
    if (e.target.value) params.set("groupStatus", e.target.value);
    else params.delete("groupStatus");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <label className={className}>
      {t("groupStatusFilter.label")}
      <select value={value ?? ""} onChange={handleChange} disabled={isPending}>
        <option value="">{t("groupStatusFilter.all")}</option>
        {GROUP_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`groupStatuses.${status}`)}
          </option>
        ))}
      </select>
    </label>
  );
}