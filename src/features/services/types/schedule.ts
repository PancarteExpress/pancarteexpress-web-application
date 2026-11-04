import type { ServiceDelay } from '../constants/schedule';

export type ServiceSchedule =
  | { delay: Exclude<ServiceDelay, 'specificDate'> }
  /** Date locale yyyy-MM-dd, jour ouvrable */
  | { delay: 'specificDate'; date: string };