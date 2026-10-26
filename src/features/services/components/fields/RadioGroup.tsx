'use client';

import type { ReactNode } from 'react';
import { ChoiceGroupShell, ChoicePill } from './ChoiceGroupShell';
import type { ChoiceOption, Columns, ElementRef } from './types';
import { useFieldIds } from './useFieldIds';

export interface RadioGroupProps<T extends string> {
  legend: ReactNode;
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onBlur?: () => void;
  inputRef?: ElementRef<HTMLInputElement>;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  hideLegend?: boolean;
  columns?: Columns;
}

export function RadioGroup<T extends string>({
  legend, options, value, onChange, onBlur, inputRef, error, hint, required, hideLegend, columns = 3,
}: RadioGroupProps<T>) {
  const { id, hintId, errorId, describedBy } = useFieldIds({ hint, error });
  const firstEnabled = options.findIndex((o) => !o.disabled && !o.locked);

  return (
    <ChoiceGroupShell
      role="radiogroup"
      legend={legend} hideLegend={hideLegend} required={required}
      hint={hint} hintId={hintId} error={error} errorId={errorId}
      describedBy={describedBy} columns={columns}
    >
      {options.map((option, index) => (
        <ChoicePill
          key={option.value}
          type="radio"
          name={id}
          value={option.value}
          label={option.label}
          checked={option.locked === true || value === option.value}
          disabled={option.disabled === true || option.locked === true}
          locked={option.locked === true}
          invalid={Boolean(error)}
          onChange={() => onChange(option.value)}
          onBlur={onBlur}
          inputRef={index === firstEnabled ? inputRef : undefined}
        />
      ))}
    </ChoiceGroupShell>
  );
}