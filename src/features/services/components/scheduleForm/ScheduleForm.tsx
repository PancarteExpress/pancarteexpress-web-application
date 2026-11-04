'use client';

import { useId, useImperativeHandle, useState, type Ref } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SCHEDULE_NOTES, SERVICE_DELAY_LABELS, SERVICE_DELAYS } from '@/features/services/constants/schedule';
import {
  createEmptyScheduleForm, createScheduleSchema, toScheduleFormValues, type ScheduleFormValues,
} from '@/features/services/schemas/schedule.schema';
import type { ServiceSchedule } from '@/features/services/types/schedule';
import { earliestSpecificDate, isBusinessDay } from '@/features/services/utils/holidays';
import { DateField } from '@/features/services/components/fields/DateField';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { toOptions } from '@/features/services/components/fields/types';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import styles from '../installationForm/installationForm.module.css';

const DELAY_OPTIONS = toOptions(SERVICE_DELAYS, SERVICE_DELAY_LABELS);
const isNonBusinessDay = (date: Date) => !isBusinessDay(date);

interface ScheduleFormProps {
  handle: Ref<ServiceFormHandle<ServiceSchedule>>;
  initialValues?: ServiceSchedule;
}

export function ScheduleForm({ handle, initialValues }: ScheduleFormProps) {
  const headingId = useId();
  const [schema] = useState(() => createScheduleSchema());
  const [earliest] = useState(() => earliestSpecificDate(new Date()));
  const [defaultValues] = useState(() =>
    initialValues ? toScheduleFormValues(initialValues) : createEmptyScheduleForm(),
  );

  const { control, handleSubmit, setValue, formState } = useForm<ScheduleFormValues, unknown, ServiceSchedule>({
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  });
  const delay = useWatch({ control, name: 'delay' });

  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<ServiceSchedule | null>((resolve) => {
        void handleSubmit((schedule) => resolve(schedule), () => resolve(null))();
      }),
  }), [handleSubmit]);

  return (
    <form noValidate className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={styles.section}>
        <h3 id={headingId} className={styles.sectionTitle}>Veuillez préciser le délai désiré</h3>

        <Controller
          control={control}
          name="delay"
          render={({ field, fieldState }) => (
            <RadioGroup
              legend="Délai désiré"
              hideLegend
              options={DELAY_OPTIONS}
              value={field.value}
              onChange={(next) => {
                field.onChange(next);
                // Hors « date précise », la date n'a plus lieu d'être
                if (next !== 'specificDate') setValue('date', null, { shouldValidate: formState.isSubmitted });
              }}
              onBlur={field.onBlur}
              inputRef={field.ref}
              columns={1}
              hint={SCHEDULE_NOTES.join(' ')}
              error={fieldState.error?.message}
              required
            />
          )}
        />

        {delay === 'specificDate' && (
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <DateField
                label="Veuillez préciser la date"
                value={field.value ? [field.value] : []}
                onChange={(dates) => field.onChange(dates[0] ?? null)}
                minDate={earliest}
                isDisabled={isNonBusinessDay}
                hint="Les fins de semaine et les jours fériés ne sont pas disponibles."
                error={fieldState.error?.message}
                required
              />
            )}
          />
        )}
      </section>
    </form>
  );
}