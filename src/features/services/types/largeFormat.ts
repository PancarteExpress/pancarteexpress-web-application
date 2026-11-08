import type {
  Acquisition, EaselStyle, LargeAccess, StoragePickupMaterial, WoodFramdStyle,
} from '../constants/largeFormat';

/** Au sol, ou au mur avec son accès */
export type LargePlacement =
  | { location: 'ground' }
  | { location: 'wall'; access: LargeAccess };

/** null = ne pas peindre ; sinon, la couleur demandée */
export type PaintColor = string | null;

export type StructureChoice =
  | { structure: 'aluminumFramd' | 'signageFramd'; acquisition: Acquisition }
  | { structure: 'woodFramd'; style: WoodFramdStyle; paintColor: PaintColor }
  | { structure: 'woodEasel'; style: EaselStyle; paintColor: PaintColor };

export type LargeInstallationDetails = { dimensions: string } & (
  | { location: 'wall'; access: LargeAccess }
  /** Au sol : une ou plusieurs structures */
  | { location: 'ground'; structures: StructureChoice[] }
);

export interface LargeStoragePickupDetails {
  materials: StoragePickupMaterial[];
}

export type LargeRetrievalDetails = LargePlacement;