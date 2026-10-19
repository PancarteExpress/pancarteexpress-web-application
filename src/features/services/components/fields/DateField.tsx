'use client';

import type { ReactNode } from 'react';
import { format, isValid, parse, startOfToday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { frCA } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import styles from './fields.module.css';
import { useFieldIds } from './useFieldIds';

const ISO_FORMAT = 'yyyy-MM-dd';

interface DateFieldProps {
  label: ReactNode;
  /** Date locale au format yyyy-MM-dd, ou null */
  value: string | null;
  onChange: (value: string) => void;
  /** Jours antérieurs désactivés (aujourd'hui par défaut) */
  minDate?: Date;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
}

export function DateField({ label, value, onChange, minDate, error, hint, required }: DateFieldProps) {
  const { hintId, errorId, describedBy } = useFieldIds({ hint, error });

  const parsed = value ? parse(value, ISO_FORMAT, new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const fromDate = minDate ?? startOfToday();

  return (
    <fieldset className={styles.group} aria-describedby={describedBy}>
      <legend className={styles.legend}>
        {label}
        {required && <span aria-hidden="true" className={styles.required}> *</span>}
      </legend>
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}

      <div className={styles.calendar} data-invalid={Boolean(error)}>
        <DayPicker
          mode="single"
          locale={frCA}
          selected={selected}
          defaultMonth={selected ?? fromDate}
          disabled={{ before: fromDate }}
          // Recliquer sur la date sélectionnée renvoie undefined : on garde la date actuelle
          onSelect={(date) => {
            if (date) onChange(format(date, ISO_FORMAT));
          }}
        />
      </div>

      <p className={styles.hint} aria-live="polite">
        {selected
          ? `Date choisie : ${format(selected, 'EEEE d MMMM yyyy', { locale: frCA })}`
          : 'Aucune date choisie'}
      </p>
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </fieldset>
  );
}