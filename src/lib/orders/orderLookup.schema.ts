import * as z from 'zod';
import { parseAddressNumber } from '../services/addressNumber';

/** Recherche d'une demande par un visiteur non connecté : numéro d'adresse (PE-…) ET courriel de la commande */
export const orderLookupSchema = z.object({
  // « PE-11191 » ou « 11191 » → 11191
  addressNumber: z
    .string()
    .max(20)
    .transform((value, ctx) => {
      const n = parseAddressNumber(value);
      if (n === null) {
        ctx.addIssue({ code: 'custom', message: 'invalidAddressNumber' });
        return z.NEVER;
      }
      return n;
    }),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;
