
import * as z from 'zod';
import { removalDateAfter, type IsoDate } from './calendar';
 
/**
 * Lecture minimale des détails d'une installation : seulement ce qu'il faut pour le retrait.
 * Volontairement indépendant du schéma complet (features), que lib ne peut pas importer.
 */
const openHouseRemovalSchema = z.object({
  openHouse: z
    .object({
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
      removeNextMonday: z.boolean(),
    })
    .nullish(),
});
 
/** Date du retrait de la visite libre, ou null si aucun retrait n'est demandé. */
export function openHouseRemovalDate(details: unknown): IsoDate | null {
  const parsed = openHouseRemovalSchema.safeParse(details);
  const openHouse = parsed.success ? parsed.data.openHouse : null;
  return openHouse?.removeNextMonday ? removalDateAfter(openHouse.dates) : null;
}
 