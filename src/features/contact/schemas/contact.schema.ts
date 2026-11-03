import { z } from 'zod';

const trop = 'Ce champ est trop long';
const requis = (max: number) => z.string().trim().min(1, 'Ce champ est requis').max(max, trop);
const optionnel = (max: number) => z.string().trim().max(max, trop).optional();

export const contactSchema = z.object({
  firstName: requis(100),
  lastName: requis(100),
  phoneNumber: requis(30),
  extension: optionnel(10),
  // Une seule adresse valide : bloque les listes "a@x.com, b@y.com"
  email: z.string().trim().pipe(z.email('Courriel invalide').max(254, trop)),
  company: optionnel(150),
  reason: requis(5000),
});

export type ContactFormData = z.infer<typeof contactSchema>;
