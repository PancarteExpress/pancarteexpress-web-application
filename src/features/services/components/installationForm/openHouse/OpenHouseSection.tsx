'use client';

import { useId, useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { OPEN_HOUSE, TEXT_LIMITS, TIME_MINUTE_STEP } from '@/features/services/constants/installation';
import { createDirectional } from '@/features/services/schemas/installation.schema';
import { addMinutesClamped, removalDayAfter, toMinutes } from '@/features/services/utils/time';
import { parseIso } from '@/features/services/utils/holidays';
import { getDay, nextMonday } from 'date-fns';
import { DateField, QuantityField, TextField, TimeField, YesNoField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';
import { addDays, format, parse } from 'date-fns';
import { frCA } from 'date-fns/locale';

const defaultEnd = (start: string) => addMinutesClamped(start, OPEN_HOUSE.defaultDurationMinutes);

export function OpenHouseSection() {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();

  const openHouse = useWatch({ control, name: 'openHouse' });
  const removalDay = removalDayAfter(openHouse.dates);
  const formatDay = (iso: string) => format(parseIso(iso), 'EEEE d MMMM', { locale: frCA });
  const removalHint = (() => {
    if (!removalDay) return undefined;
    if (getDay(parseIso(removalDay)) === 1) return `Retrait prévu le ${formatDay(removalDay)}.`;
    // Lundi férié : on précise lequel
    const last = [...openHouse.dates].sort().at(-1);
    const monday = last ? format(nextMonday(parseIso(last)), 'yyyy-MM-dd') : null;
    return `Retrait prévu le ${formatDay(removalDay)}${monday ? ` (${formatDay(monday)} férié)` : ''}.`;
  })();

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

      <QuantityField
        label="Combien de directionnelles visite libre avez-vous besoin ?"
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
              placeholder="Ex. : Newman et Léger"
              multiline
              rows={1}
            />
          )}
        />
      ))}

      <Controller
        control={control}
        name="openHouse.flagCount"
        render={({ field, fieldState }) => (
          <QuantityField
            label="Combien de drapeaux visite libre avez-vous besoin ?"
            value={field.value}
            onChange={field.onChange}
            min={0}
            max={OPEN_HOUSE.maxFlags}
            hint={`Max ${OPEN_HOUSE.maxFlags}`}
            error={fieldState.error?.message}
          />
        )}
      />

      <div>
        <button
          type="button"
          className={styles.toggleButton}
          aria-pressed={openHouse.twoDates}
          onClick={() => {
            const next = !openHouse.twoDates;
            update('openHouse.twoDates', next);
              const [first] = getValues('openHouse.dates');
              // Deux dates : on ajoute le lendemain ; une seule : on garde la première
              if (first) {
                update('openHouse.dates', next
                  ? [first, format(addDays(parse(first, 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM-dd')]
                  : [first]);
              }
          }}
        >
          {openHouse.twoDates ? 'Une seule date' : 'Choisir deux dates'}
        </button>

        <Controller
          control={control}
          name="openHouse.dates"
          render={({ field, fieldState }) => (
            <DateField
              label={openHouse.twoDates ? 'Dates de la visite libre' : 'Date de la visite libre'}
              value={field.value}
              onChange={field.onChange}
              span={openHouse.twoDates ? OPEN_HOUSE.maxDates : 1}
              hint={openHouse.twoDates ? 'Cliquez sur le premier jour : le lendemain est ajouté automatiquement. Les mêmes heures s\'appliquent aux deux jours.' : undefined}
              error={fieldState.error?.message}
              required
            />
          )}
        />
      </div>

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
      
      <Controller
        control={control}
        name="openHouse.removeNextMonday"
        render={(props) => (
          <YesNoField
            {...bindField(props)}
            legend="Devons-nous retirer le matériel de la visite libre le lundi qui suit ?"
            hint={removalHint}
            required
          />
        )}
      />
    </section>
  );
}