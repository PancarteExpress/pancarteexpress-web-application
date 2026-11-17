import type { DeliveryFormValues } from '../schemas/delivery.schema';
import type { DeliveryAddonItem, DeliveryDetails, DeliveryDirectional, DeliveryFrame } from '../types/delivery';

/**
 * Livraison telle que saisie jusqu'ici, pour l'aperçu des notes à chaque clic.
 * Un modèle (ou un ajout) pas encore choisi, ou un modèle particulier sans description, n'apparaît pas encore.
 */
export function deliveryPreviewDetails(v: DeliveryFormValues): DeliveryDetails {
  return {
    frames: v.materials.includes('frames')
      ? v.frames.flatMap((f): DeliveryFrame[] => {
          const base = { quantity: f.quantity, withAnchorsAndPoles: f.withAnchorsAndPoles ?? false };
          if (f.model === null) return [];
          if (f.model === 'custom') return f.description.trim() ? [{ ...base, model: 'custom', description: f.description }] : [];
          return [{ ...base, model: f.model }];
        })
      : null,
    addons: v.materials.includes('addons')
      ? v.addons.flatMap((a): DeliveryAddonItem[] => {
          if (a.addon === null) return [];
          if (a.addon === 'other') return [{ addon: 'other', mention: a.mention, quantity: a.quantity }];
          if (a.addon === 'openHouse') return [{ addon: 'openHouse', hours: a.openHouseHours.trim() || null, quantity: a.quantity }];
          if (a.addon === 'customNoMention') {
            return [{ addon: 'customNoMention', model: a.customModel.trim() || null, quantity: a.quantity }];
          }
          return [{ addon: a.addon, quantity: a.quantity }];
        })
      : null,
    keybox: v.materials.includes('keybox') ? { quantity: v.keybox.quantity, code: v.keybox.code.trim() || null } : null,
    directionals: v.materials.includes('directional')
      ? v.directionals.flatMap((d): DeliveryDirectional[] => {
          const base = { quantity: d.quantity, withPoles: d.withPoles ?? false };
          if (d.model === null) return [];
          if (d.model === 'custom') return d.description.trim() ? [{ ...base, model: 'custom', description: d.description }] : [];
          return [{ ...base, model: d.model }];
        })
      : null,
    // Un matériel sans description n'apparaît pas encore
    others: v.materials.includes('other')
      ? v.others.filter((o) => o.description.trim()).map((o) => ({ description: o.description, quantity: o.quantity }))
      : null,
  };
}
