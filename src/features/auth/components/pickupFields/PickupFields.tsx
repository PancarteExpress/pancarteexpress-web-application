"use client";

import { Controller, useFormContext } from "react-hook-form";
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

  return (
    <>
      <fieldset className={styles.inputs}>
        <legend className="block text-sm font-medium">
          Devons-nous ramasser votre matériel ? <span className={styles.req}>*</span>
        </legend>
        <label>
          <input type="radio" value="address" {...register("pickupMode")} /> Oui, à une adresse particulière
        </label>
        <label>
          <input type="radio" value="warehouse" {...register("pickupMode")} /> Non, le matériel sera déposé à l entrepôt
        </label>
      </fieldset>

      {pickupMode === "address" && (
        <div className={styles.inputs}>
          <label htmlFor="pickupAddress" className="block text-sm font-medium">
            Adresse complète de l endroit où ramasser le matériel <span className={styles.req}>*</span>
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
          {errors.pickupAddress && <span className={styles.error}>{errors.pickupAddress.message}</span>}
          {errors.pickupCity && <span className={styles.error}>{errors.pickupCity.message}</span>}
          {errors.pickupPostalCode && <span className={styles.error}>{errors.pickupPostalCode.message}</span>}
        </div>
      )}

      {pickupMode === "warehouse" && (
        <div className={styles.inputs}>
          <Controller
            control={control}
            name="receptionDate"
            render={({ field, fieldState }) => (
              <DateField
                label="Quand recevrons-nous le matériel ?"
                value={field.value ? [field.value] : []}
                onChange={(dates) => field.onChange(dates[0] ?? "")}
                minDate={earliestPickupDate}
                isDisabled={isNonBusinessDay}
                hint="Les fins de semaine et les jours fériés ne sont pas disponibles."
                error={fieldState.error?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="pickupNotes"
            render={({ field }) => (
              <TextField
                label="Autres détails ?"
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