
import type { ServiceDelay } from '@prisma/client';
import { addDays, firstBusinessDayFrom, isoWeekday, nextBusinessDay, todayInToronto, type IsoDate } from './calendar';
 
/** Priorités OptimoRoute : L(ow), M(edium), H(igh), C(ritical). */
export type OptimoPriority = 'L' | 'M' | 'H' | 'C';
 
export type Schedule = { date: IsoDate; priority: OptimoPriority };
 
/** Même règles que l'ancien site (hook WooCommerce). */
export function computeSchedule(
  delay: ServiceDelay,
  specificDate: IsoDate | null,
  now: Date = new Date(),
): Schedule {
  const today = todayInToronto(now);
 
  switch (delay) {
    case 'standard24h':
      return { date: nextBusinessDay(today), priority: 'M' };
 
    case 'urgent12h':
      return { date: nextBusinessDay(today), priority: 'H' };
 
    case 'sameDay': {
      const weekday = isoWeekday(today);
      // Lun–jeu : lendemain ; vendredi : jour même ; fin de semaine : prochain jour ouvrable
      const date =
        weekday <= 4 ? firstBusinessDayFrom(addDays(today, 1)) : weekday === 5 ? today : nextBusinessDay(today);
      return { date, priority: 'H' };
    }
 
    case 'specificDate':
      if (!specificDate) throw new Error('specificDate requise pour le délai "specificDate"');
      return { date: firstBusinessDayFrom(specificDate), priority: 'M' };
  }
}
 