'use client';

import type { ReactNode } from 'react';
import { addDays, format, isValid, parse, startOfToday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { enCA, frCA } from 'react-day-picker/locale';
import { useFormatter, useTranslations } from 'next-intl';
import 'react-day-picker/style.css';
import styles from './fields.module.css';
import { useFieldIds } from './useFieldIds';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import { formatDay } from '@/features/services/utils/formatDay';

const ISO_FORMAT = 'yyyy-MM-dd';

const toDate = (iso: string): Date | undefined => {
  const d = parse(iso, ISO_FORMAT, new Date());
  return isValid(d) ? d : undefined;
};
const toIso = (d: Date) => format(d, ISO_FORMAT);

interface DateFieldProps {
  label: ReactNode;
  /** Dates locales au format yyyy-MM-dd */
  value: string[];
  onChange: (value: string[]) => void;
  /** Nombre de jours consécutifs sélectionnés en un clic (1 = date simple) */
  span?: number;
  /** Jours antérieurs désactivés (aujourd'hui par défaut) */
  minDate?: Date;
  /** Jours supplémentaires à désactiver (ex. fins de semaine et jours fériés) */
  isDisabled?: (date: Date) => boolean;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
}

export function DateField({ label, value, onChange, span = 1, minDate, isDisabled, error, hint, required }: DateFieldProps) {
  const { hintId, errorId, describedBy } = useFieldIds({ hint, error });
  const t = useTranslations('services.fields');
  const formatter = useFormatter();
  const locale = useAppLocale();
  const translateError = useIssueMessage('services.errors');

  const selected = value.map(toDate).filter((d): d is Date => d !== undefined);
  const fromDate = minDate ?? startOfToday();
  const shared = {
    locale: locale === 'en' ? enCA : frCA,
    defaultMonth: selected[0] ?? fromDate,
    disabled: isDisabled ? [{ before: fromDate }, isDisabled] : { before: fromDate },
  };

  return (
    <fieldset className={styles.group} aria-describedby={describedBy}>
      <legend className={styles.legend}>
        {label}
        {required && <span aria-hidden="true" className={styles.required}> *</span>}
      </legend>
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}

      <div className={styles.calendar} data-invalid={Boolean(error)}>
        {span === 1 ? (
          <DayPicker
            {...shared}
            mode="single"
            selected={selected[0]}
            // Recliquer sur la date sélectionnée renvoie undefined : on garde la date actuelle
            onSelect={(date) => {
              if (date) onChange([toIso(date)]);
            }}
          />
        ) : (
          <DayPicker
            {...shared}
            mode="range"
            selected={selected[0] ? { from: selected[0], to: addDays(selected[0], span - 1) } : undefined}
            // Le jour cliqué devient le premier jour ; les suivants sont ajoutés automatiquement
            onSelect={(_range, clickedDay) => {
              onChange(Array.from({ length: span }, (_, i) => toIso(addDays(clickedDay, i))));
            }}
          />
        )}
      </div>

      <p className={styles.hint} aria-live="polite">
        {selected.length > 0
          ? t('selectedDates', {
              count: selected.length,
              dates: formatter.list(selected.map((d) => formatDay(d, locale))),
            })
          : t('noDateSelected')}
      </p>
      {error && <p id={errorId} className={styles.error}>{translateError(error)}</p>}
    </fieldset>
  );
}