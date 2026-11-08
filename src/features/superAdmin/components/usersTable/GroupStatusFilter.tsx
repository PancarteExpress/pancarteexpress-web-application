"use client";

import { useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GROUP_STATUSES, type GroupStatusFilter as Filter } from "@/lib/users/adminUserFilters.schema";
import { GROUP_STATUS_LABELS } from "../../constants/labels";

interface GroupStatusFilterProps {
  value: Filter;
  className?: string;
}

export function GroupStatusFilter({ value, className }: GroupStatusFilterProps) {
  const router = useRouter();
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
      Statut de groupe
      <select value={value ?? ""} onChange={handleChange} disabled={isPending}>
        <option value="">Tous</option>
        {GROUP_STATUSES.map((status) => (
          <option key={status} value={status}>
            {GROUP_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  );
}