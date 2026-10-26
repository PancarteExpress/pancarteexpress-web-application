import { TIME_MINUTE_STEP } from '@/features/services/constants/installation';
import { addDays, format, isValid, parse } from 'date-fns';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Dernière heure sélectionnable (23:55 avec un pas de 5 min) */
export const LATEST_TIME_MINUTES = 24 * 60 - TIME_MINUTE_STEP;

export const isValidTime = (time: string): boolean => TIME_REGEX.test(time);

/** Format strict yyyy-MM-dd et date réelle (refuse 2026-02-31) */
export const isValidIsoDate = (date: string): boolean =>
  DATE_REGEX.test(date) && isValid(parse(date, 'yyyy-MM-dd', new Date()));

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const fromMinutes = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** Ajoute des minutes sans dépasser la dernière heure de la journée */
export const addMinutesClamped = (time: string, minutes: number): string =>
  fromMinutes(Math.min(toMinutes(time) + minutes, LATEST_TIME_MINUTES));

/** `second` est-il le lendemain de `first` ? (dates yyyy-MM-dd) */
export const isNextDay = (first: string, second: string): boolean =>
  isValidIsoDate(first) && format(addDays(parse(first, 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM-dd') === second;