'use client';

import { useId, useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { OPEN_HOUSE, TEXT_LIMITS, TIME_MINUTE_STEP } from '@/features/services/constants/installation';
import { createDirectional } from '@/features/services/schemas/installation.schema';
import { addMinutesClamped, removalDayAfter, toMinutes } from '@/features/services/utils/time';
import { parseIso } from '@/features/services/utils/holidays';
import { getDay, nextMonday } from 'date-fns';
import { DateField, QuantityField, TextField, TimeField, YesNoField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';
import { addDays, format, parse } from 'date-fns';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { formatIsoDay } from '@/features/services/utils/formatDay';

import { FaHouseUser } from "react-icons/fa6";

const defaultEnd = (start: string) => addMinutesClamped(start, OPEN_HOUSE.defaultDurationMinutes);

export function OpenHouseSection() {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();
  const t = useTranslations('services');
  const locale = useAppLocale();

  const openHouse = useWatch({ control, name: 'openHouse' });
  const removalDay = removalDayAfter(openHouse.dates);
  const formatDay = (iso: string) => formatIsoDay(iso, locale, false);
  const removalHint = (() => {
    if (!removalDay) return undefined;
    if (getDay(parseIso(removalDay)) === 1) return t('installation.removalPlanned', { date: formatDay(removalDay) });
    // Lundi férié : on précise lequel
    const last = [...openHouse.dates].sort().at(-1);
    const monday = last ? format(nextMonday(parseIso(last)), 'yyyy-MM-dd') : null;
    return monday
      ? t('installation.removalPlannedHoliday', { date: formatDay(removalDay), monday: formatDay(monday) })
      : t('installation.removalPlanned', { date: formatDay(removalDay) });
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
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><FaHouseUser size={34}/> {t('installation.openHouseTitle')}</h3>

      <QuantityField
        label={t('installation.openHouseDirectionalsQuantity')}
        value={fields.length}
        onChange={handleDirectionalsChange}
        min={0}
        max={OPEN_HOUSE.maxDirectionals}
        hint={t('common.max', { max: OPEN_HOUSE.maxDirectionals })}
      />
      
      {fields.map((field, index) => (
        <Controller
          key={field.id}
          control={control}
          name={`openHouse.directionals.${index}.placement`}
          render={(props) => (
            <fieldset className={styles.unit}>
            <TextField
              {...bindField(props)}
              label={t('installation.directionalPlacement', { number: index + 1 })}
              maxLength={TEXT_LIMITS.directionalPlacement}
              placeholder={t('installation.placementExample')}
              multiline
              rows={1}
            />
            </fieldset>
          )}
        />
      ))}

      <Controller
        control={control}
        name="openHouse.flagCount"
        render={({ field, fieldState }) => (
          <QuantityField
            label={t('installation.openHouseFlagsQuantity')}
            value={field.value}
            onChange={field.onChange}
            min={0}
            max={OPEN_HOUSE.maxFlags}
            hint={t('common.max', { max: OPEN_HOUSE.maxFlags })}
            error={fieldState.error?.message}
          />
        )}
      />
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
          {openHouse.twoDates ? t('installation.oneDate') : t('installation.twoDates')}
      </button>

      <div style={{ display: 'flex', gap:'2rem' }}>
        <Controller
          control={control}
          name="openHouse.dates"
          render={({ field, fieldState }) => (
            <DateField
              label={openHouse.twoDates ? t('installation.openHouseDates') : t('installation.openHouseDate')}
              value={field.value}
              onChange={field.onChange}
              span={openHouse.twoDates ? OPEN_HOUSE.maxDates : 1}
              hint={openHouse.twoDates ? t('installation.twoDatesHint') : undefined}
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
                label={t('installation.startTime')}
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
                label={t('installation.endTime')}
                minuteStep={TIME_MINUTE_STEP}
                required
              />
            )}
          />
        </div>
      </div>

      <Controller
        control={control}
        name="openHouse.removeNextMonday"
        render={(props) => (
          <YesNoField
            {...bindField(props)}
            legend={t('installation.removeNextMonday')}
            hint={removalHint}
            required
          />
        )}
      />
    </section>
  );
}