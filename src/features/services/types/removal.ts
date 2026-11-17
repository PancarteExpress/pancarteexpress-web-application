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

/**
 * Invités : que faire du matériel retiré.
 * - deliver : le livrer à une autre adresse ; leaveOnSite : le laisser sur place ;
 * - storage : l'entreposer, après l'ouverture d'un compte (l'invité est ensuite dirigé vers l'inscription).
 */
export type AfterRemoval =
  | { choice: 'deliver'; address: string; dropOff: string | null }
  | { choice: 'leaveOnSite'; dropOff: string | null }
  | { choice: 'storage' };

export interface RemovalDetails {
  /** null : membre, ou retrait enregistré avant cette question */
  afterRemoval: AfterRemoval | null;
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