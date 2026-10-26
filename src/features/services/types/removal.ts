import type { Placement } from './installation';

export interface RemovalFrameUnit {
  uid: string;
  /** Chaque pancarte a son propre emplacement */
  placement: Placement;
}

export interface RemovalDetails {
  frames: { units: RemovalFrameUnit[] } | null;
}