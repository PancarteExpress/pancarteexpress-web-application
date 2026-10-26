'use client';

import type { ReactNode } from 'react';
import { fromMinutes, isValidTime, toMinutes } from '@/features/services/utils/time';
import styles from './fields.module.css';
import type { ElementRef } from './types';
import { useFieldIds } from './useFieldIds';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const pad = (n: number) => String(n).padStart(2, '0');

interface TimeFieldProps {
  label: ReactNode;
  /** Heure au format HH:mm (24 h) */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLSelectElement>;
  minuteStep?: number;
  /** Seules les heures strictement postérieures sont proposées (ex. heure de fin > début) */
  after?: string;
  error?: string;
  required?: boolean;
}

export function TimeField({
  label, value, onChange, onBlur, inputRef, minuteStep = 5, after, error, required,
}: TimeFieldProps) {
  const { id, errorId, describedBy } = useFieldIds({ error });

  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  const [hour, minute] = isValidTime(value) ? value.split(':').map(Number) : [0, 0];
  const afterTotal = after && isValidTime(after) ? toMinutes(after) : -1;
  const isAllowed = (h: number, m: number) => h * 60 + m > afterTotal;

  // Changer l'heure peut rendre les minutes invalides : on prend alors la première minute valide
  const handleHour = (h: number) => {
    const m = isAllowed(h, minute) ? minute : minutes.find((mm) => isAllowed(h, mm));
    if (m !== undefined) onChange(fromMinutes(h * 60 + m));
  };

  const shared = {
    className: styles.select,
    'aria-invalid': Boolean(error) || undefined,
    onBlur,
  };

  return (
    <fieldset className={styles.group} aria-describedby={describedBy}>
      <legend className={styles.legend}>
        {label}
        {required && <span aria-hidden="true" className={styles.required}> *</span>}
      </legend>

      <div className={styles.time}>
        <label htmlFor={`${id}-h`} className={styles.visuallyHidden}>Heures</label>
        <select
          {...shared}
          ref={inputRef}
          id={`${id}-h`}
          value={hour}
          onChange={(e) => handleHour(Number(e.target.value))}
        >
          {HOURS.map((h) => (
            <option key={h} value={h} disabled={!minutes.some((m) => isAllowed(h, m))}>
              {pad(h)} h
            </option>
          ))}
        </select>

        <span aria-hidden="true">:</span>

        <label htmlFor={`${id}-m`} className={styles.visuallyHidden}>Minutes</label>
        <select
          {...shared}
          id={`${id}-m`}
          value={minute}
          onChange={(e) => onChange(fromMinutes(hour * 60 + Number(e.target.value)))}
        >
          {minutes.map((m) => (
            <option key={m} value={m} disabled={!isAllowed(hour, m)}>
              {pad(m)}
            </option>
          ))}
        </select>
      </div>

      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </fieldset>
  );
}