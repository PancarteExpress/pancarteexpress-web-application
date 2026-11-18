import { ADDONS_WITH_MODEL, type Addon, type AddonWithModel } from '../constants/installation';
import type { InstallationFormValues } from '../schemas/installation.schema';
import { toPlacement, validatePlacement, type PlacementFormValues } from '../schemas/placement.schema';
import type {
  AddonAssignment, FrameDisplayName, FrameModel, InstallationDetails, Placement, UnitTargets,
} from '../types/installation';

/*
 * Aperçu des notes OptimoRoute pendant la saisie : la saisie en cours (brouillon) est transformée
 * en installation, en gardant seulement ce qui est déjà rempli. Le texte vient ensuite de la même
 * fonction que l'envoi réel (buildInstallationNotes) : seule la tolérance aux réponses manquantes diffère.
 */

type FrameModelType = NonNullable<InstallationFormValues['frames']['units'][number]['model']>;

const hasModel = (addon: Addon): addon is AddonWithModel => (ADDONS_WITH_MODEL as readonly string[]).includes(addon);

/** Emplacement complet, sinon null : il apparaîtra dans les notes une fois rempli */
export function completePlacement(
  p: PlacementFormValues,
  /** Mêmes options que la validation (ex. côté de la fenêtre facultatif au retrait) */
  options?: { windowSideOptional?: boolean; mountingOptional?: boolean },
): Placement | null {
  let complete = true;
  validatePlacement(p, [], () => {
    complete = false;
  }, options);
  return complete ? toPlacement(p) : null;
}

/** Modèle choisi ; un modèle particulier sans description n'est pas encore affiché */
function frameModel(model: FrameModelType | null, description: string): FrameModel | null {
  if (model === null) return null;
  if (model === 'custom') return description.trim() ? { type: 'custom', description } : null;
  return { type: model };
}

function displayName(useAccountName: boolean | null, names: string, accountName: string | null): FrameDisplayName | null {
  // Invités (pas de compte) : le nom saisi
  if (accountName === null) return names.trim() ? { type: 'custom', names } : null;
  if (useAccountName === true) return { type: 'account', name: accountName };
  if (useAccountName === false) return names.trim() ? { type: 'custom', names } : null;
  return null;
}

function targets(t: { quantity: number; frameUids: string[]; onSite: boolean }): UnitTargets {
  return {
    quantity: t.quantity,
    frameUids: t.frameUids,
    onSiteCount: t.onSite ? Math.max(0, t.quantity - t.frameUids.length) : 0,
  };
}

const ownPlacements = (placements: PlacementFormValues[], hasFrames: boolean): Placement[] | null =>
  hasFrames ? null : placements.map((p) => completePlacement(p)).filter((p): p is Placement => p !== null);

/** Installation telle que saisie jusqu'ici ; les parties incomplètes sont ignorées */
export function installationPreviewDetails(v: InstallationFormValues, accountName: string | null): InstallationDetails {
  const has = (m: InstallationFormValues['materials'][number]) => v.materials.includes(m);
  const hasFrames = has('frames');

  const addons: AddonAssignment[] = has('addons')
    ? v.addons.map((a) => {
        const base = { ...targets(a), placements: ownPlacements(a.placements, hasFrames) };
        const { addon } = a;
        switch (addon) {
          case 'other':
            return { ...base, addon, mention: a.mention };
          case 'customNoMention':
            return { ...base, addon, details: a.mention || null };
          default:
            return hasModel(addon)
              ? { ...base, addon, model: frameModel(a.model, a.modelDescription) ?? { type: 'regular' } }
              : { ...base, addon };
        }
      })
    : [];

  return {
    // Ramassage : pas dans les notes pour l'instant
    pickupAddress: null,
    frames: hasFrames
      ? {
          units: v.frames.units.map((u) => ({
            uid: u.uid,
            model: frameModel(u.model, u.modelDescription),
            displayName: displayName(u.useAccountName, u.displayName, accountName),
            placement: completePlacement(u.placement) ?? { location: 'ground' },
          })),
        }
      : null,
    kits: has('kit')
      ? {
          // Un kit sans modèle choisi n'apparaît pas encore
          units: v.kits.units.flatMap((k) =>
            k.model === null
              ? []
              : [{
                  uid: k.uid,
                  model: k.model === 'custom' ? { type: 'custom' as const, description: k.description } : { type: k.model },
                  placement: completePlacement(k.placement) ?? { location: 'ground' as const },
                }],
          ),
        }
      : null,
    addons: has('addons') ? addons : null,
    openHouse: has('openHouse')
      ? {
          ...targets(v.openHouse),
          placements: ownPlacements(v.openHouse.placements, hasFrames),
          dates: v.openHouse.dates,
          startTime: v.openHouse.startTime,
          endTime: v.openHouse.endTime,
          directionals: v.openHouse.directionals,
          flagCount: v.openHouse.flagCount,
          removeNextMonday: v.openHouse.removeNextMonday ?? false,
        }
      : null,
    keybox: has('keybox') ? { code: v.keybox.code, placement: v.keybox.placement } : null,
    flags:
      // Invités : mention saisie librement
      has('flags') && accountName === null
        ? { mention: 'other', customMention: v.flags.customMention, quantity: v.flags.quantity, placement: v.flags.placement }
        : has('flags') && v.flags.mention !== null
        ? v.flags.mention === 'other'
          ? { mention: 'other', customMention: v.flags.customMention, quantity: v.flags.quantity, placement: v.flags.placement }
          : { mention: v.flags.mention, quantity: v.flags.quantity, placement: v.flags.placement }
        : null,
    directionals:
      has('directional') && accountName === null
        ? { mention: 'other', customMention: v.directionals.customMention ?? '', units: v.directionals.units }
        : has('directional') && v.directionals.mention !== null
        ? { mention: v.directionals.mention, units: v.directionals.units }
        : null,
    otherNeeds: has('other') && v.otherNeeds.trim() ? v.otherNeeds : null,
  };
}
