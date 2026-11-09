"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useIssueMessage } from "@/shared/hooks/useIssueMessage";
import AddressAutocomplete from "@/shared/components/addressAutocomplete/AddressAutocomplete";
import type { PickupFieldsInput } from "@/lib/auth/auth.schema";

import { useState } from "react";
import { DateField } from "@/features/services/components/fields/DateField";
import { TextField } from "@/features/services/components/fields";
import { earliestSpecificDate, isBusinessDay } from "@/features/services/utils/holidays";

import styles from "@/features/auth/components/registerForm/RegisterForm.module.css";

const isNonBusinessDay = (date: Date) => !isBusinessDay(date);

export function PickupFields() {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<PickupFieldsInput>();
  const pickupMode = watch("pickupMode");
  const [earliestPickupDate] = useState(() => earliestSpecificDate(new Date()));
  const t = useTranslations("register.pickup");
  const tv = useIssueMessage("errors.validation");

  return (
    <>
      <fieldset className={styles.inputs}>
        <legend className="block text-sm font-medium">
          {t("legend")} <span className={styles.req}>*</span>
        </legend>
        <label>
          <input type="radio" value="address" {...register("pickupMode")} /> {t("atAddress")}
        </label>
        <label>
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
                value={field.value ?? ""}
                inputRef={field.ref}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.pickupAddress}
                onSelect={(addr) => {
                  setValue("pickupAddress", addr ? `${addr.streetNumber} ${addr.streetName}` : "", { shouldValidate: true });
                  setValue("pickupCity", addr?.city ?? "", { shouldValidate: true });
                  setValue("pickupPostalCode", addr?.postalCode ?? "", { shouldValidate: true });
                }}
              />
            )}
          />
          {errors.pickupAddress && <span className={styles.error}>{tv(errors.pickupAddress.message)}</span>}
          {errors.pickupCity && <span className={styles.error}>{tv(errors.pickupCity.message)}</span>}
          {errors.pickupPostalCode && <span className={styles.error}>{tv(errors.pickupPostalCode.message)}</span>}
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