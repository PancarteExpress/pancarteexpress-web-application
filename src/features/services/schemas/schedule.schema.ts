import * as z from 'zod';
import { format, startOfDay } from 'date-fns';
import { SERVICE_DELAYS } from '../constants/schedule';
import type { ServiceSchedule } from '../types/schedule';
import { earliestSpecificDate, isBusinessDay, parseIso } from '../utils/holidays';
import { isValidIsoDate } from '../utils/time';
import { REQUIRED, defined, type Report } from './shared';

const scheduleFormSchema = z.object({
  delay: z.enum(SERVICE_DELAYS).nullable(),
  date: z.string().nullable(),
});

export function createScheduleSchema({ today = new Date() }: { today?: Date } = {}) {
  const earliest = format(earliestSpecificDate(startOfDay(today)), 'yyyy-MM-dd');

  return scheduleFormSchema
    .superRefine((v, ctx) => {
      const report: Report = (path, message) => ctx.addIssue({ code: 'custom', path, message });
      if (v.delay === null) return report(['delay'], REQUIRED);
      if (v.delay !== 'specificDate') return;

      if (v.date === null || !isValidIsoDate(v.date)) report(['date'], 'Veuillez préciser la date');
      else if (v.date < earliest) report(['date'], 'Choisissez une date à partir du prochain jour ouvrable');
      else if (!isBusinessDay(parseIso(v.date))) report(['date'], 'Choisissez un jour ouvrable (ni fin de semaine ni jour férié)');
    })
    .transform((v): ServiceSchedule => {
      const delay = defined(v.delay);
      return delay === 'specificDate' ? { delay, date: defined(v.date) } : { delay };
    });
}

export type ScheduleSchema = ReturnType<typeof createScheduleSchema>;
export type ScheduleFormValues = z.input<ScheduleSchema>;

export const createEmptyScheduleForm = (): ScheduleFormValues => ({ delay: 'standard24h', date: null });

export const toScheduleFormValues = (s: ServiceSchedule): ScheduleFormValues => ({
  delay: s.delay,
  date: s.delay === 'specificDate' ? s.date : null,
});