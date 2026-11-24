"use client";

import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";
import googleCompletion from "./CompleteProfileForm.module.css";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

import { zodResolver } from "@hookform/resolvers/zod";
import { readErrorCode } from "@/lib/errors/appError";
import { completeProfileSchema, type CompleteProfileInput } from "@/lib/auth/auth.schema";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import { formatPhone } from "@/shared/utils/phone";
import { BillingAddressField } from "../billingAddressField/BillingAddressField";
import { PickupFields } from "../pickupFields/PickupFields";

export default function CompleteProfileForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("register.completeProfile");
  const tErrors = useTranslations("errors");
  const tv = useIssueMessage("errors.validation");
  const [serverError, setServerError] = useState<string | null>(null);
  const { update } = useSession();

  const form = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { pickupMode: "address", billingAddress: "", phoneNumber: "", companyName: "" },
  });

  const onSubmit = async (data: CompleteProfileInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/complete-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      setServerError(tErrors(await readErrorCode(res)));
      return;
    }

    // Relit la session : needsPickupInfo passe à false, sinon le checkout bloquerait encore
    await update();
    router.replace(`/${locale}/dashboard`);
    router.refresh();
  };

  return (
    <div className={`${googleCompletion.mainContainer} ${styles.mainContainer}`}>
      <div className={googleCompletion.header}>
        <h1>{t("title")}</h1>
        <h2>{t("subtitle")}</h2>
      </div>
      
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Google ne fournit ni téléphone ni agence : demandés ici */}
          <div className={styles.groupInputs}>
            <div className={styles.inputs}>
              <label htmlFor="completePhoneNumber" className="block text-sm font-medium">
                {t("phoneNumber")} <span className={styles.req}>*</span>
              </label>
              <input
                id="completePhoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={14}
                placeholder="(514) 825-2709"
                aria-invalid={Boolean(form.formState.errors.phoneNumber) || undefined}
                {...form.register("phoneNumber")}
                onInput={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value); }}
              />
              {form.formState.errors.phoneNumber && (
                <span className={styles.error}>{tv(form.formState.errors.phoneNumber.message)}</span>
              )}
            </div>

            <div className={styles.inputs}>
              <label htmlFor="completeCompanyName" className="block text-sm font-medium">
                {t("companyName")}
              </label>
              <input
                id="completeCompanyName"
                type="text"
                autoComplete="organization"
                {...form.register("companyName")}
              />
            </div>
          </div>

          <BillingAddressField />
          <PickupFields />

          {serverError && <div className={styles.error} role="alert">{serverError}</div>}

          <button type="submit" disabled={form.formState.isSubmitting} className={styles.btnConnection}>
            {t("save")}
          </button>
        </form>
      </FormProvider>
    </div>
  );
}