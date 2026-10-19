'use client';

import { useId, useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { OPEN_HOUSE, TEXT_LIMITS, TIME_MINUTE_STEP } from '@/features/services/constants/installation';
import { createDirectional } from '@/features/services/schemas/installation.schema';
import { addMinutesClamped, toMinutes } from '@/features/services/utils/time';
import { DateField, QuantityField, TextField, TimeField, YesNoField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

const defaultEnd = (start: string) => addMinutesClamped(start, OPEN_HOUSE.defaultDurationMinutes);

export function OpenHouseSection() {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();

  const openHouse = useWatch({ control, name: 'openHouse' });

  const { fields, append, remove } = useFieldArray({ control, name: 'openHouse.directionals' });

  // Tant que l'utilisateur n'a pas choisi lui-même l'heure de fin, elle suit le début (+ 2 h)
  const [endEdited, setEndEdited] = useState(() => openHouse.endTime !== defaultEnd(openHouse.startTime));

  const handleStartChange = (start: string) => {
    update('openHouse.startTime', start);
    const end = getValues('openHouse.endTime');
    if (!endEdited || toMinutes(end) <= toMinutes(start)) update('openHouse.endTime', defaultEnd(start));
  };

  const handleDirectionalsChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createDirectional), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails de la visite libre</h3>

      <Controller
        control={control}
        name="openHouse.date"
        render={({ field, fieldState }) => (
          <DateField
            label="Date de la visite libre"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            required
          />
        )}
      />

      <div className={styles.timeRow}>
        <Controller
          control={control}
          name="openHouse.startTime"
          render={(props) => (
            <TimeField
              {...bindField(props)}
              onChange={handleStartChange}
              label="Heure de début"
              minuteStep={TIME_MINUTE_STEP}
              required
            />
          )}
        />
        <Controller
          control={control}
          name="openHouse.endTime"
          render={(props) => (
            <TimeField
              {...bindField(props)}
              onChange={(end) => {
                props.field.onChange(end);
                setEndEdited(true);
              }}
              after={openHouse.startTime}
              label="Heure de fin"
              minuteStep={TIME_MINUTE_STEP}
              required
            />
          )}
        />
      </div>

      <QuantityField
        label="Combien de directionnelles avez-vous besoin ?"
        value={fields.length}
        onChange={handleDirectionalsChange}
        min={0}
        max={OPEN_HOUSE.maxDirectionals}
        hint={`Max ${OPEN_HOUSE.maxDirectionals}`}
      />
      {fields.map((field, index) => (
        <Controller
          key={field.id}
          control={control}
          name={`openHouse.directionals.${index}.placement`}
          render={(props) => (
            <TextField
              {...bindField(props)}
              label={`Veuillez indiquer l'emplacement de la directionnelle #${index + 1}`}
              maxLength={TEXT_LIMITS.directionalPlacement}
              multiline
              rows={2}
              required
            />
          )}
        />
      ))}

      <Controller
        control={control}
        name="openHouse.flagCount"
        render={({ field, fieldState }) => (
          <QuantityField
            label="Combien de drapeaux avez-vous besoin ?"
            value={field.value}
            onChange={field.onChange}
            min={0}
            max={OPEN_HOUSE.maxFlags}
            hint={`Max ${OPEN_HOUSE.maxFlags}`}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="openHouse.removeNextMonday"
        render={(props) => (
          <YesNoField
            {...bindField(props)}
            legend="Devons-nous retirer le matériel de la visite libre le lundi qui suit ?"
            required
          />
        )}
      />
    </section>
  );
}