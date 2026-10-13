import { z } from 'zod';

const requis = z.string().trim().min(1, 'Ce champ est requis');

export const contactSchema = z.object({
  firstName: requis,
  lastName: requis,
  phoneNumber: requis,
  extension: z.string().optional(),
  email: requis,
  company: z.string().optional(),
  reason: requis,
});

export type ContactFormData = z.infer<typeof contactSchema>;