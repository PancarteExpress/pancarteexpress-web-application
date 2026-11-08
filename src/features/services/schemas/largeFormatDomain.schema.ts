import * as z from 'zod';
import {
  ACQUISITIONS, EASEL_STYLES, LARGE_ACCESS, STORAGE_PICKUP_MATERIALS, WOOD_FRAMD_STYLES,
} from '../constants/largeFormat';
import type { LargeFormatService } from '../types/services';

/*
 * Forme « domaine » des services grand format, telle qu'enregistrée dans Service.details (Json).
 * Sert à relire ces détails en toute sécurité côté serveur (courriel interne).
 */

const structure = z.union([
  z.object({ structure: z.enum(['aluminumFramd', 'signageFramd']), acquisition: z.enum(ACQUISITIONS) }),
  z.object({ structure: z.literal('woodFramd'), style: z.enum(WOOD_FRAMD_STYLES), paintColor: z.string().nullable() }),
  z.object({ structure: z.literal('woodEasel'), style: z.enum(EASEL_STYLES), paintColor: z.string().nullable() }),
]);

// z.union plutôt que discriminatedUnion : un même `type` a plusieurs formes (au sol / au mur)
const largeFormatService = z.union([
  z.object({ type: z.literal('largeInstallation'), dimensions: z.string(), location: z.literal('wall'), access: z.enum(LARGE_ACCESS) }),
  z.object({ type: z.literal('largeInstallation'), dimensions: z.string(), location: z.literal('ground'), structures: z.array(structure) }),
  z.object({ type: z.literal('largeStoragePickup'), materials: z.array(z.enum(STORAGE_PICKUP_MATERIALS)) }),
  z.object({ type: z.literal('largeRetrieval'), location: z.literal('ground') }),
  z.object({ type: z.literal('largeRetrieval'), location: z.literal('wall'), access: z.enum(LARGE_ACCESS) }),
]);

/** Relit un service grand format depuis la base ; null si les détails sont illisibles */
export function parseLargeFormatService(type: string, details: unknown): LargeFormatService | null {
  const input = typeof details === 'object' && details !== null ? { ...details, type } : { type };
  const result = largeFormatService.safeParse(input);
  return result.success ? result.data : null;
}
