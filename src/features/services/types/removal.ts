import type { FlagMention, SignMention } from '../constants/installation';
import type { PlacedUnit, Placement } from './installation';

/** Mention des drapeaux ; null : retrait enregistré avant l'ajout de cette question */
export type RemovalFlagMention =
  | { mention: Exclude<FlagMention, 'other'> | null }
  | { mention: 'other'; customMention: string };

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
  flags: ({ quantity: number; placement: string } & RemovalFlagMention) | null;
  /** Un emplacement par directionnelle ; mention null : retrait enregistré avant l'ajout de cette question */
  directionals: { mention: SignMention | null; units: PlacedUnit[] } | null;
  otherDetails: string | null;
}