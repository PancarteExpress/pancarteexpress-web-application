'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { MAX_QUANTITY } from '@/lib/constants/cart';
import styles from './QuantityStepper.module.css';

interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}

export default function QuantityStepper({ value, onChange, label, min = 1, max = MAX_QUANTITY }: Props) {
  const t = useTranslations('cart');
  // Brouillon : permet de vider le champ pendant la saisie sans forcer la valeur à 1
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div role="group" aria-label={label} className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={t('decrease')}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-label={t('quantity')}
      />
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={t('increase')}
      >
        +
      </button>
    </div>
  );
}