import * as z from 'zod';

const trop = 'Ce champ est trop long';
const requis = (max: number) => z.string().trim().min(1, 'Ce champ est requis').max(max, trop);
const optionnel = (max: number) => z.string().trim().max(max, trop).optional();

export const contactSchema = z.object({
  firstName: requis(100),
  lastName: requis(100),
  phoneNumber: z.string().trim().regex(/^\(\d{3}\) \d{3}-\d{4}$/, { message: 'invalidPhone' }),
  extension: z.string().trim().regex(/^\d{0,6}$/, { message: 'invalidExtension' }).optional(),
  email: z.string().trim().pipe(z.email('Courriel invalide').max(254, trop)),
  company: optionnel(150),
  reason: requis(5000),
  // Anti-spam : champ piège (doit rester vide) et durée de remplissage
  website: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
