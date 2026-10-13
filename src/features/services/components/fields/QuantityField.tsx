'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import styles from './fields.module.css';
import type { ElementRef } from './types';
import { useFieldIds } from './useFieldIds';

interface QuantityFieldProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLInputElement>;
  min?: number;
  max?: number;
  error?: string;
  hint?: ReactNode;
}

export function QuantityField({
  label, value, onChange, onBlur, inputRef, min = 1, max, error, hint,
}: QuantityFieldProps) {
  const { id, hintId, errorId, describedBy } = useFieldIds({ hint, error });
  const [draft, setDraft] = useState(() => String(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Valeur modifiée de l'extérieur (reset, remontage) : resynchronisation pendant le rendu,
  // ce qui évite un rendu intermédiaire désynchronisé qu'introduirait un useEffect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(String(value));
  }

  const clamp = (n: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, n));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    if (digits === '') {
      setDraft(''); // vide toléré pendant la saisie, jamais propagé
      return;
    }
    const next = clamp(Number(digits));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const handleBlur = () => {
    setDraft(String(value)); // un champ laissé vide reprend la dernière valeur valide
    onBlur?.();
  };

  return (
    <div className={`${styles.field} ${styles.inline}`}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        className={`${styles.input} ${styles.quantity}`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={draft}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {hint && <span id={hintId} className={styles.limit}>{hint}</span>}
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  );
}