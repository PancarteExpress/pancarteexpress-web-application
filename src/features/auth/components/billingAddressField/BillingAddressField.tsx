"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import AddressAutocomplete from "@/shared/components/addressAutocomplete/AddressAutocomplete";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";

/** Adresse de facturation (inscription et complétion du profil), dans un formulaire qui a un champ `billingAddress` */
export function BillingAddressField() {
  const t = useTranslations("register");
  const tv = useIssueMessage("errors.validation");
  const { control, formState: { errors } } = useFormContext<{ billingAddress: string }>();

  return (
    <div className={styles.inputs}>
      <label htmlFor="billingAddress">
        {t("formBillingAddress")} <span className={styles.req}>*</span>
      </label>
      <Controller
        control={control}
        name="billingAddress"
        render={({ field }) => (
          <AddressAutocomplete
            id="billingAddress"
            value={field.value ?? ""}
            inputRef={field.ref}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!errors.billingAddress}
          />
        )}
      />
      {errors.billingAddress && <span className={styles.error}>{tv(errors.billingAddress.message)}</span>}
    </div>
  );
}
