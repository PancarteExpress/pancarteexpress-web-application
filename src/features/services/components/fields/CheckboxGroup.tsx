'use client';

import type { ReactNode } from 'react';
import { ChoiceGroupShell, ChoicePill } from './ChoiceGroupShell';
import type { ChoiceOption, Columns, ElementRef } from './types';
import { useFieldIds } from './useFieldIds';

export interface CheckboxGroupProps<T extends string> {
  legend: ReactNode;
  options: readonly ChoiceOption<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLInputElement>;
  /** Au-delà, les options non cochées sont désactivées */
  max?: number;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  hideLegend?: boolean;
  columns?: Columns;
}

export function CheckboxGroup<T extends string>({
  legend, options, value, onChange, onBlur, inputRef, max, error, hint, required, hideLegend, columns = 3,
}: CheckboxGroupProps<T>) {
  const { id, hintId, errorId, describedBy } = useFieldIds({ hint, error });
  const limitReached = max !== undefined && value.length >= max;
  const firstEnabled = options.findIndex((o) => !o.disabled && !o.locked);

  const toggle = (option: T) => {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <ChoiceGroupShell
      legend={legend} hideLegend={hideLegend} required={required}
      hint={hint} hintId={hintId} error={error} errorId={errorId}
      describedBy={describedBy} columns={columns}
    >
      {options.map((option, index) => {
        const locked = option.locked === true;
        const checked = locked || value.includes(option.value);
        return (
          <ChoicePill
            key={option.value}
            type="checkbox"
            name={id}
            value={option.value}
            label={option.label}
            checked={checked}
            disabled={locked || option.disabled === true || (limitReached && !checked)}
            locked={locked}
            invalid={Boolean(error)}
            onChange={() => toggle(option.value)}
            onBlur={onBlur}
            inputRef={index === firstEnabled ? inputRef : undefined}
          />
        );
      })}
    </ChoiceGroupShell>
  );
}