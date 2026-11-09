'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup, type RadioGroupProps } from './RadioGroup';
import { toOptions } from './types';

type YesNo = 'yes' | 'no';

const YES_NO = ['yes', 'no'] as const satisfies readonly YesNo[];

type YesNoFieldProps = Omit<RadioGroupProps<YesNo>, 'options' | 'value' | 'onChange' | 'columns'> & {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

export function YesNoField({ value, onChange, ...rest }: YesNoFieldProps) {
  const t = useTranslations('services.fields');
  return (
    <RadioGroup
      {...rest}
      columns={2}
      options={toOptions(YES_NO, (v) => t(v))}
      value={value === null ? null : value ? 'yes' : 'no'}
      onChange={(choice) => onChange(choice === 'yes')}
    />
  );
}