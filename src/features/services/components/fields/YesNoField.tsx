'use client';

import { RadioGroup, type RadioGroupProps } from './RadioGroup';
import type { ChoiceOption } from './types';

type YesNo = 'yes' | 'no';

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
] as const satisfies readonly ChoiceOption<YesNo>[];

type YesNoFieldProps = Omit<RadioGroupProps<YesNo>, 'options' | 'value' | 'onChange' | 'columns'> & {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

export function YesNoField({ value, onChange, ...rest }: YesNoFieldProps) {
  return (
    <RadioGroup
      {...rest}
      columns={2}
      options={YES_NO_OPTIONS}
      value={value === null ? null : value ? 'yes' : 'no'}
      onChange={(choice) => onChange(choice === 'yes')}
    />
  );
}