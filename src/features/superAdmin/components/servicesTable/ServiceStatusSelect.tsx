"use client";

import type { ChangeEvent } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ServiceStatus } from "@prisma/client";
import { SERVICE_STATUSES, isServiceStatus } from "@/lib/services/serviceStatus";
import { updateServiceStatusAction } from "@/lib/services/server/serviceStatus.actions";

interface ServiceStatusSelectProps {
  serviceId: string;
  /** Pour la confirmation, ex. « PE-11277 » */
  label: string;
  status: ServiceStatus;
  className?: string;
}

export function ServiceStatusSelect({ serviceId, label, status, className }: ServiceStatusSelectProps) {
  const router = useRouter();
  const t = useTranslations("superAdmin");
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isServiceStatus(next) || next === status) return;

    if (!window.confirm(t("serviceStatusSelect.confirm", { label, status: t(`serviceStatuses.${next}`) }))) return;

    startTransition(async () => {
      const result = await updateServiceStatusAction(serviceId, next);
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
      value={status}
      onChange={handleChange}
      disabled={isPending}
      aria-label={t("serviceStatusSelect.ariaLabel", { label })}
    >
      {SERVICE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`serviceStatuses.${s}`)}
        </option>
      ))}
    </select>
  );
}