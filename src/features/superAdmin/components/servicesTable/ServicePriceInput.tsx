"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateServicePriceAction } from "@/lib/services/services.actions";
import { centsToInput } from "@/shared/utils/money";
import styles from "./ServicesTable.module.css";

interface ServicePriceInputProps {
  serviceId: string;
  draftPrice: number | null;
  isSent: boolean;
}

export function ServicePriceInput({ serviceId, draftPrice, isSent }: ServicePriceInputProps) {
  const router = useRouter();
  const initial = centsToInput(draftPrice);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  

  const isDirty = value.trim() !== initial;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDirty) return;
    setError(null);

    startTransition(async () => {
      const result = await updateServicePriceAction(serviceId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <form className={styles.priceForm} onSubmit={handleSubmit}>
      <div className={styles.priceField}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0,00"
          disabled={isPending}
          aria-label="Prix du service"
          aria-invalid={error !== null}
        />
        <span aria-hidden="true">$</span>
      </div>
      <button type="submit" className={styles.btnSave} disabled={!isDirty || isPending}>
        {isPending ? "…" : "Enregistrer"}
      </button>

      {!isDirty && draftPrice !== null && (
        <span className={isSent ? styles.badgeSent : styles.badgeDraft}>
          {isSent ? "Envoyé" : "Brouillon"}
        </span>
      )}

      {error && <p className={styles.priceError} role="alert">{error}</p>}
    </form>
  );
}