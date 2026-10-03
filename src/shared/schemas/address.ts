import { z } from 'zod';
import type { ParsedAddress } from '@/shared/types/address';

const POSTAL_CODE_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export const addressSchema = z.object({
  streetNumber: z.string().trim().min(1, 'Numéro civique requis').regex(/^\d+[A-Z]?(-\d+)?$/i, 'Numéro civique invalide'),
  streetName: z.string().trim().min(2, 'Rue requise').max(120),
  city: z.string().trim().min(2, 'Ville requise').max(80),
  province: z.literal('QC', { error: 'Seules les adresses au Québec sont acceptées' }),
  postalCode: z
    .string()
    .trim()
    .regex(POSTAL_CODE_REGEX, 'Code postal complet requis (ex. H2X 1Y4)')
    .transform((v) => {
      const clean = v.replace(/\s/g, '').toUpperCase();
      return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }),
  formatted: z.string().trim().min(1).max(255),
}) satisfies z.ZodType<ParsedAddress, unknown>;