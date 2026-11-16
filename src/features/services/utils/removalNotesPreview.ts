import type { RemovalFormValues } from '../schemas/removal.schema';
import type { RemovalDetails } from '../types/removal';
import { completePlacement } from './installationNotesPreview';

/**
 * Retrait tel que saisi jusqu'ici, pour l'aperçu des notes à chaque clic.
 * Un emplacement de pancarte ou d'ajout incomplet compte comme « Au sol » ; une mention non choisie est omise.
 */
export function removalPreviewDetails(v: RemovalFormValues): RemovalDetails {
  return {
    frames: v.materials.includes('frames')
      ? { units: v.frames.units.map((u) => ({ uid: u.uid, placement: completePlacement(u.placement) ?? { location: 'ground' } })) }
      : null,
    addons: v.materials.includes('addons')
      ? {
          units: v.addons.units.map((u) => ({ uid: u.uid, placement: completePlacement(u.placement) ?? { location: 'ground' } })),
          details: v.addons.details.trim() || null,
        }
      : null,
    keybox: v.materials.includes('keybox')
      ? { quantity: v.keybox.quantity, code: v.keybox.code, placement: v.keybox.placement }
      : null,
    flags: v.materials.includes('flags')
      ? v.flags.mention === 'other'
        ? { mention: 'other', customMention: v.flags.customMention, quantity: v.flags.quantity, placement: v.flags.placement }
        : { mention: v.flags.mention, quantity: v.flags.quantity, placement: v.flags.placement }
      : null,
    directionals: v.materials.includes('directional')
      ? { mention: v.directionals.mention, units: v.directionals.units }
      : null,
    otherDetails: v.materials.includes('other') && v.otherDetails.trim() ? v.otherDetails : null,
  };
}
