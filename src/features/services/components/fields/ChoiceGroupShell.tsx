import type { ReactNode } from 'react';
import styles from './fields.module.css';
import type { Columns, ElementRef } from './types';

interface ShellProps {
  legend: ReactNode;
  hideLegend?: boolean;
  required?: boolean;
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  describedBy?: string;
  columns: Columns;
  role?: 'radiogroup';
  children: ReactNode;
}

export function ChoiceGroupShell({ legend, hideLegend, required, hint, hintId, error, errorId, describedBy, columns, role, children, }: ShellProps) {
  return (
    <fieldset className={styles.group} role={role} aria-required={role && required ? true : undefined} aria-describedby={describedBy}>
      <legend className={hideLegend ? styles.visuallyHidden : styles.legend}>
        {legend}
        {required && <span aria-hidden="true" className={styles.required}> *</span>}
      </legend>
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
      <div className={styles.grid} data-columns={columns}>{children}</div>
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </fieldset>
  );
}

interface PillProps {
  type: 'radio' | 'checkbox';
  name: string;
  value: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  locked: boolean;
  invalid: boolean;
  onChange: () => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLInputElement>;
}

export function ChoicePill({ type, name, value, label, checked, disabled, locked, invalid, onChange, onBlur, inputRef, }: PillProps) {
  return (
    <label className={styles.choice} data-checked={checked} data-disabled={disabled} data-locked={locked} >
      <input
        ref={inputRef}
        className={styles.visuallyHidden}
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={onChange}
        onBlur={onBlur}
      />
      <span>{label}</span>
    </label>
  );
}