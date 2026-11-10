import * as z from 'zod';

/** Recherche d'une commande par un visiteur non connecté : numéro ET courriel de la commande */
export const orderLookupSchema = z.object({
  orderNumber: z.coerce.number().int().positive(),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;
