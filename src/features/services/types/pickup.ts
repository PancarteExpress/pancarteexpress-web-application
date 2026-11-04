import type { PickupMaterial } from '../constants/pickup';

export interface PickupDetails {
  materials: PickupMaterial[];
  /** Nouveaux modèles (changement d'informations, d'agence…) */
  newModels: boolean;
  details: string | null;
}