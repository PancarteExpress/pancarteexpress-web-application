/*
 * Anciennes installations, mises à jour avant relecture :
 * - question du ramassage (invités) : déplacée des pancartes vers l'installation (novembre 2026) ;
 * - emplacement par élément (novembre 2026) :
 * un seul `placement` pour toute l'installation. On le reporte sur chaque pancarte, kit,
 * ajout et visite libre, pour que rien ne se perde.
 * Les données arrivent non typées (base, localStorage) : on ne touche qu'aux formes reconnues.
 */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Ajoute `placement` aux unités qui n'en ont pas */
const withUnitPlacement = (group: unknown, placement: unknown): unknown =>
  isObject(group) && Array.isArray(group.units)
    ? { ...group, units: group.units.map((u) => (isObject(u) && !('placement' in u) ? { ...u, placement } : u)) }
    : group;

/** Ajoute `placements` à une entrée (ajout, visite libre) qui n'en a pas */
const withOwnPlacements = (entry: unknown, placements: unknown): unknown =>
  isObject(entry) && !('placements' in entry) ? { ...entry, placements } : entry;

const withFlagPlacement = (flags: unknown): unknown =>
  isObject(flags) && !('placement' in flags) ? { ...flags, placement: '' } : flags;

function upgradeDetailsPlacement(details: unknown): unknown {
  if (!isObject(details) || !('placement' in details)) return details;
  const { placement, ...rest } = details;
  // Avec des pancartes, les ajouts vont sur elles : pas d'emplacement propre
  const ownPlacements = isObject(rest.frames) ? null : [placement];

  return {
    ...rest,
    frames: withUnitPlacement(rest.frames, placement),
    kits: withUnitPlacement(rest.kits, placement),
    addons: Array.isArray(rest.addons) ? rest.addons.map((a) => withOwnPlacements(a, ownPlacements)) : rest.addons,
    openHouse: rest.openHouse == null ? rest.openHouse : withOwnPlacements(rest.openHouse, ownPlacements),
    flags: withFlagPlacement(rest.flags),
  };
}

function upgradeFormPlacement(values: unknown): unknown {
  if (!isObject(values) || !('placement' in values)) return values;
  const { placement, ...rest } = values;
  // Le formulaire garde toujours une liste : elle ne sert que sans pancarte
  const ownPlacements = [placement];

  return {
    ...rest,
    frames: withUnitPlacement(rest.frames, placement),
    kits: withUnitPlacement(rest.kits, placement),
    addons: Array.isArray(rest.addons) ? rest.addons.map((a) => withOwnPlacements(a, ownPlacements)) : rest.addons,
    openHouse: withOwnPlacements(rest.openHouse, ownPlacements),
    flags: withFlagPlacement(rest.flags),
  };
}

/** Ramassage : frames.pickupAddress → pickupAddress de l'installation */
function upgradeDetailsPickup(details: unknown): unknown {
  if (!isObject(details)) return details;
  if (isObject(details.frames) && 'pickupAddress' in details.frames) {
    const { pickupAddress, ...frames } = details.frames;
    return { ...details, frames, pickupAddress: 'pickupAddress' in details ? details.pickupAddress : pickupAddress };
  }
  return 'pickupAddress' in details ? details : { ...details, pickupAddress: null };
}

/** Ramassage : frames.pickup / frames.pickupAddress → pickup / pickupAddress de l'installation */
function upgradeFormPickup(values: unknown): unknown {
  if (!isObject(values)) return values;
  if (isObject(values.frames) && ('pickup' in values.frames || 'pickupAddress' in values.frames)) {
    const { pickup, pickupAddress, ...frames } = values.frames;
    return {
      ...values,
      frames,
      pickup: 'pickup' in values ? values.pickup : pickup ?? null,
      pickupAddress: 'pickupAddress' in values ? values.pickupAddress : pickupAddress ?? '',
    };
  }
  return 'pickup' in values ? values : { ...values, pickup: null, pickupAddress: '' };
}

/** Forme domaine (service enregistré, Service.details en base, panier) */
export const upgradeInstallationDetails = (details: unknown): unknown =>
  upgradeDetailsPickup(upgradeDetailsPlacement(details));

/** Forme formulaire (brouillon enregistré dans le navigateur) */
export const upgradeInstallationFormValues = (values: unknown): unknown =>
  upgradeFormPickup(upgradeFormPlacement(values));
