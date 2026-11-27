import type { ServiceType } from '@prisma/client';
import type { InstallationDetails } from '@/features/services/types/installation';
import type { RemovalDetails } from '@/features/services/types/removal';
import { buildInstallationNotes } from './installationNotes';
import { buildRemovalNotes } from './removalNotes';
import type { CorrectionDetails } from '@/features/services/types/correction';
import { buildCorrectionNotes } from './correctionNotes';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import { buildDeliveryNotes } from './deliveryNotes';
import type { PickupDetails } from '@/features/services/types/pickup';
import { buildPickupNotes } from './pickupNotes';

/*
 * Notes OptimoRoute d'une adresse : résumé des services pour les chauffeurs, toujours en français.
 * Sans dépendance serveur : le formulaire l'utilise aussi pour l'aperçu, identique à l'envoi réel.
 */

/** Libellés des services dans les notes */
export const SERVICE_NOTE_LABELS: Record<ServiceType, string> = {
  installation: 'INSTALLATION',
  removal: 'RECUP',
  correction: 'CORRECTION',
  pickup: 'PICK UP',
  delivery: 'LIVRER',

  // Jamais envoyés à OptimoRoute (grand format exclu de la synchronisation) ; requis par le type
  largeInstallation: 'INSTALLATION GRAND FORMAT',
  largeStoragePickup: 'RAMASSAGE ENTREPOSAGE',
  largeRetrieval: 'RECUP GRAND FORMAT',
};

/**
 * Ordre des services dans les notes : ce qu'on installe, ce qu'on livre, ce qu'on récupère,
 * les corrections, puis ce qu'on ramasse.
 */
export const SERVICE_NOTE_ORDER: readonly ServiceType[] = ['installation', 'delivery', 'removal', 'correction', 'pickup'];

/** Services de l'adresse, chacun une fois, dans l'ordre des notes (les types hors liste à la fin) */
export function buildServiceNotes(serviceTypes: readonly ServiceType[]): string {
  const present = new Set(serviceTypes);
  const ordered = [
    ...SERVICE_NOTE_ORDER.filter((type) => present.has(type)),
    ...[...present].filter((type) => !SERVICE_NOTE_ORDER.includes(type)),
  ];
  return ordered.map((type) => SERVICE_NOTE_LABELS[type]).join(' + ');
}

/** Service d'une adresse : le type suffit, sauf les services qui ont déjà leur résumé détaillé */
export type NoteService =
  | { type: ServiceType }
  | ({ type: 'installation' } & InstallationDetails)
  | ({ type: 'removal' } & RemovalDetails)
  | ({ type: 'correction' } & CorrectionDetails)
  | ({ type: 'delivery' } & DeliveryDetails)
  | ({ type: 'pickup' } & PickupDetails);

const hasInstallationDetails = (s: NoteService): s is { type: 'installation' } & InstallationDetails =>
  s.type === 'installation' && 'frames' in s;

const hasRemovalDetails = (s: NoteService): s is { type: 'removal' } & RemovalDetails =>
  s.type === 'removal' && 'frames' in s;

const hasCorrectionDetails = (s: NoteService): s is { type: 'correction' } & CorrectionDetails =>
  s.type === 'correction' && 'kind' in s;

const hasDeliveryDetails = (s: NoteService): s is { type: 'delivery' } & DeliveryDetails =>
  s.type === 'delivery' && 'frames' in s;

const hasPickupDetails = (s: NoteService): s is { type: 'pickup' } & PickupDetails =>
  s.type === 'pickup' && 'materials' in s;

/**
 * Notes d'une adresse : les services dans l'ordre des notes, détaillés selon la nomenclature quand c'est prévu.
 * Le nom du compte n'apparaît qu'une fois pour toute l'adresse : dans le premier service détaillé.
 */
export function buildAddressNotes(
  services: readonly NoteService[],
  accountName: string | null,
  /**
   * terrain : description d'une adresse de type terrain, ajoutée à la fin : **TERRAIN** [description]
   * hasAttachments : fichiers joints à l'adresse, **VOIR PHOTO** à la toute fin
   */
  { terrain = null, hasAttachments = false }: { terrain?: string | null; hasAttachments?: boolean } = {},
): string {
  let account = accountName;
  const notes = SERVICE_NOTE_ORDER.flatMap((type) => {
    const service = services.find((s) => s.type === type);
    if (!service) return [];
    if (hasInstallationDetails(service)) {
      const note = buildInstallationNotes(service, account);
      account = null;
      return [note];
    }
    if (hasRemovalDetails(service)) {
      const note = buildRemovalNotes(service, account);
      account = null;
      return [note];
    }
    if (hasCorrectionDetails(service)) {
      const note = buildCorrectionNotes(service, account);
      account = null;
      return [note];
    }
    if (hasDeliveryDetails(service)) {
      const note = buildDeliveryNotes(service, account);
      account = null;
      return [note];
    }
    if (hasPickupDetails(service)) {
      const note = buildPickupNotes(service, account);
      account = null;
      return [note];
    }
    return [SERVICE_NOTE_LABELS[type]];
  }).join(' + ');
  if (!notes) return notes;
  const description = terrain?.replace(/\s*\n\s*/g, ' ').trim();
  return [notes, description ? `**TERRAIN** [${description}]` : '', hasAttachments ? '**VOIR PHOTO**' : '']
    .filter(Boolean)
    .join(' ');
}
