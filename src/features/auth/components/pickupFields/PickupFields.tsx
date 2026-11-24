"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import AddressAutocomplete from "@/shared/components/addressAutocomplete/AddressAutocomplete";
import type { PickupFieldsInput } from "@/lib/auth/auth.schema";

import { useState } from "react";
import { DateField } from "@/features/services/components/fields/DateField";
import { TextField } from "@/features/services/components/fields";
import { earliestReceptionDate, isBusinessDay } from "@/features/services/utils/holidays";

import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";
import { color } from "framer-motion";

const isNonBusinessDay = (date: Date) => !isBusinessDay(date);

export function PickupFields() {
  const { register, control, setValue, getValues, watch, formState: { errors } } = useFormContext<PickupFieldsInput>();
  const pickupMode = watch("pickupMode");
  const [earliestPickupDate] = useState(() => earliestReceptionDate());
  // Texte affiché dans le champ (adresse complète) ; l'adresse enregistrée est découpée en rue, ville et code postal
  const [addressText, setAddressText] = useState(() => getValues("pickupAddress") ?? "");

  const t = useTranslations("register.pickup");
  const tv = useIssueMessage("errors.validation");

  return (
    <>
      <fieldset className={styles.inputs}>
        <label>
          {t("legend")} <span className={styles.req}>*</span>
        </label>
        <label style={{ color: "black", fontSize: "0.875rem"}}>
          <input type="radio" value="address" {...register("pickupMode")} /> {t("atAddress")}
        </label>
        <label style={{ color: "black", fontSize: "0.875rem"}}>
          <input type="radio" value="warehouse" {...register("pickupMode")} /> {t("atWarehouse")}
        </label>
      </fieldset>

      {pickupMode === "address" && (
        <div className={styles.inputs}>
          <label htmlFor="pickupAddress" className="block text-sm font-medium">
            {t("addressLabel")} <span className={styles.req}>*</span>
          </label>
          <Controller
            control={control}
            name="pickupAddress"
            render={({ field }) => (
              <AddressAutocomplete
                id="pickupAddress"
                value={addressText}
                inputRef={field.ref}
                onChange={(text: string) => {
                  setAddressText(text);
                  // Tapée ou modifiée à la main : la ville et le code postal ne correspondent plus, il faut choisir une suggestion
                  field.onChange(text);
                  setValue("pickupCity", "");
                  setValue("pickupPostalCode", "");
                }}
                onBlur={field.onBlur}
                aria-invalid={!!errors.pickupAddress}
                onSelect={(addr) => {
                  // Ville et code postal d'abord : l'adresse est validée en dernier, une fois tout rempli
                  setValue("pickupCity", addr?.city ?? "");
                  setValue("pickupPostalCode", addr?.postalCode ?? "");
                  setValue("pickupAddress", addr ? `${addr.streetNumber} ${addr.streetName}`.trim() : "", {
                    shouldValidate: true,
                  });
                }}
              />
            )}
          />
        </div>
      )}

      {pickupMode === "warehouse" && (
        <div className={styles.inputs}>
          <Controller
            control={control}
            name="receptionDate"
            render={({ field, fieldState }) => (
              <DateField
                label={t("receptionDate")}
                value={field.value ? [field.value] : []}
                onChange={(dates) => field.onChange(dates[0] ?? "")}
                minDate={earliestPickupDate}
                isDisabled={isNonBusinessDay}
                hint={t("dateHint")}
                error={tv(fieldState.error?.message)}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="pickupNotes"
            render={({ field }) => (
              <TextField
                label={t("notes")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                multiline
                rows={3}
              />
            )}
          />
        </div>
      )}
    </>
  );
}