"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pickupSchema, type PickupFieldsInput } from "@/lib/auth/auth.schema";
import { PickupFields } from "../pickupFields/PickupFields";
import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";

export default function CompleteProfileForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PickupFieldsInput>({
    resolver: zodResolver(pickupSchema),
    defaultValues: { pickupMode: "address" },
  });

  const onSubmit = async (data: PickupFieldsInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/complete-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Une erreur est survenue");
      return;
    }

    router.replace(`/${locale}/dashboard`);
    router.refresh();
  };

  return (
    <div className={styles.mainContainer}>
      <h2>Complétez votre profil</h2>
      <p>Indiquez comment récupérer votre matériel avant de continuer.</p>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <PickupFields />
          {serverError && <div className={styles.error}>{serverError}</div>}
          <button type="submit" disabled={form.formState.isSubmitting} className={styles.btnConnection}>
            Enregistrer
          </button>
        </form>
      </FormProvider>
    </div>
  );
}