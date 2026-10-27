import type { PlacedUnit, Placement } from './installation';

/** Unité retirée (pancarte ou ajout), chacune avec son emplacement */
export interface RemovalUnit {
  uid: string;
  placement: Placement;
}

export interface RemovalDetails {
  frames: { units: RemovalUnit[] } | null;
  addons: {
    units: RemovalUnit[];
    /** Précision facultative sur les ajouts à retirer */
    details: string | null;
  } | null;
  /** Un seul code et un seul emplacement pour toutes les boîtes */
  keybox: { quantity: number; code: string; placement: string } | null;
  /** Un seul emplacement pour tous les drapeaux */
  flags: { quantity: number; placement: string } | null;
  /** Un emplacement par directionnelle */
  directionals: { units: PlacedUnit[] } | null;
  otherDetails: string | null;
}