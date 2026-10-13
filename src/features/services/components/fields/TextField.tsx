'use client';

import type { ChangeEvent, ReactNode } from 'react';
import styles from './fields.module.css';
import type { ElementRef } from './types';
import { useFieldIds } from './useFieldIds';

interface TextFieldProps {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  hideLabel?: boolean;
  error?: string;
  hint?: ReactNode;
}

export function TextField({
  label, value, onChange, onBlur, inputRef, maxLength, multiline = false, rows = 3,
  placeholder, required, hideLabel, error, hint,
}: TextFieldProps) {
  const { id, hintId, errorId, describedBy: baseDescribedBy } = useFieldIds({ hint, error });
  const counterId = maxLength ? `${id}-counter` : undefined;
  const describedBy = [baseDescribedBy, counterId].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    value,
    maxLength,
    placeholder,
    required,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': describedBy,
    onBlur,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
        {required && <span aria-hidden="true" className={styles.required}> *</span>}
      </label>
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}

      {multiline
        ? <textarea {...shared} ref={inputRef} rows={rows} className={styles.input} />
        : <input {...shared} ref={inputRef} type="text" className={styles.input} />}

      {maxLength && (
        <span id={counterId} className={styles.counter} data-full={value.length >= maxLength}>
          {value.length}/{maxLength} caractères
        </span>
      )}
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  );
}