import { PICKUP_MATERIALS, type PickupMaterial } from '@/features/services/constants/pickup';
import type { PickupDetails } from '@/features/services/types/pickup';
import { upper } from './installationNotes';

/** Libellés du formulaire (pas en majuscules), toujours en français pour l'équipe */
const PICKUP_MATERIAL_NOTE_LABELS: Record<PickupMaterial, string> = {
  frames: 'Pancartes',
  anchors: 'Ancrages',
  poles: 'Poteaux',
  addons: 'Ajouts',
  keybox: 'Boîtes à clés',
  directional: 'Directionnelles',
  other: 'Autres',
};

/** Première lettre en majuscule, le reste tel que saisi */
const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase('fr-CA') + text.slice(1);

/**
 * Ramassage dans les notes OptimoRoute :
 * PICK UP {COMPTE} [Pancartes, Ajouts, …] **Détails supplémentaires**
 */
export function buildPickupNotes(details: PickupDetails, accountName: string | null): string {
  const name = accountName ? ` ${upper(accountName)}` : '';
  const materials = PICKUP_MATERIALS.filter((m) => details.materials.includes(m)).map((m) => PICKUP_MATERIAL_NOTE_LABELS[m]);
  const list = materials.length > 0 ? ` [${materials.join(', ')}]` : '';
  // Sur une seule ligne, pour ne pas couper la note
  const text = details.details?.replace(/\s*\n\s*/g, ' ').trim();
  return `PICK UP${name}${list}${text ? ` **${capitalize(text)}**` : ''}`;
}
