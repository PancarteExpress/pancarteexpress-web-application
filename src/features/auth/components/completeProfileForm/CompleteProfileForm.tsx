"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { isAppErrorCode } from "@/lib/errors/appError";
import { pickupSchema, type PickupFieldsInput } from "@/lib/auth/auth.schema";
import { PickupFields } from "../pickupFields/PickupFields";
import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";

export default function CompleteProfileForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("register.completeProfile");
  const tErrors = useTranslations("errors");
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
      const error: unknown = body?.error;
      // Code d'erreur connu : traduit ; sinon le texte du serveur, à défaut l'erreur générique
      setServerError(isAppErrorCode(error) ? tErrors(error) : typeof error === "string" ? error : tErrors("serverError"));
      return;
    }

    router.replace(`/${locale}/dashboard`);
    router.refresh();
  };

  return (
    <div className={styles.mainContainer}>
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <PickupFields />
          {serverError && <div className={styles.error}>{serverError}</div>}
          <button type="submit" disabled={form.formState.isSubmitting} className={styles.btnConnection}>
            {t("save")}
          </button>
        </form>
      </FormProvider>
    </div>
  );
}