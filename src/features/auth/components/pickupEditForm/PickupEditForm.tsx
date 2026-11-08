"use client";

import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pickupSchema, type PickupFieldsInput } from "@/lib/auth/auth.schema";
import { PickupFields } from "../pickupFields/PickupFields";
import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";

type PickupRecord = {
  mode: "ADDRESS" | "WAREHOUSE";
  address: string | null;
  city: string | null;
  postalCode: string | null;
  receptionDate: string | null; // "YYYY-MM-DD"
  notes: string | null;
} | null;

function toFormValues(pickup: PickupRecord): PickupFieldsInput {
  if (!pickup) return { pickupMode: "address" };
  if (pickup.mode === "WAREHOUSE") {
    return {
      pickupMode: "warehouse",
      receptionDate: pickup.receptionDate ?? "",
      pickupNotes: pickup.notes ?? "",
    };
  }
  return {
    pickupMode: "address",
    pickupAddress: pickup.address ?? "",
    pickupCity: pickup.city ?? "",
    pickupPostalCode: pickup.postalCode ?? "",
  };
}

export function PickupEditForm() {
  const [loaded, setLoaded] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<PickupFieldsInput>({
    resolver: zodResolver(pickupSchema),
    defaultValues: { pickupMode: "address" },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/pickup")
      .then((res) => res.json())
      .then((body: { pickup: PickupRecord }) => {
        if (cancelled) return;
        form.reset(toFormValues(body.pickup));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setServerError("Impossible de charger le ramassage.");
      });
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = async (data: PickupFieldsInput) => {
    setServerError(null);
    setSuccess(null);

    const res = await fetch("/api/auth/pickup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Une erreur est survenue");
      return;
    }
    setSuccess("Ramassage mis à jour");
  };

  if (!loaded && !serverError) return <p>Chargement…</p>;

  return (
    <div className={styles.mainContainer}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <PickupFields />
          {serverError && <div className={styles.error}>{serverError}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <button type="submit" disabled={form.formState.isSubmitting} className={styles.btnConnection}>
            Enregistrer le ramassage
          </button>
        </form>
      </FormProvider>
    </div>
  );
}