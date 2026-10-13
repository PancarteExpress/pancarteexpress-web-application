import type { Addon, Ladder, Mounting } from '../constants/installation';

export type FramePlacement =
  | { location: 'ground' | 'ramp' }
  | { location: 'wall'; ladder: Ladder; mounting: Mounting }
  | {
      location: 'fence' | 'balcony';
      access: { type: 'ladder'; ladder: Ladder } | { type: 'phoneAppointment'; contact: string };
    }
  | { location: 'other'; description: string };

export type FrameModel =
  | { type: 'regular' }
  | { type: 'prestige' }
  | { type: 'custom'; description: string };

export type FrameDisplayName =
  | { type: 'account'; name: string }
  | { type: 'custom'; names: string };

export interface FrameUnit {
  uid: string;
  model: FrameModel | null;
  displayName: FrameDisplayName | null;
  placement: FramePlacement;
}

export interface FramesDetails {
  /** null = membre, ou ramassage non requis */
  pickupAddress: string | null;
  units: FrameUnit[];
}

export type AddonAssignment = {
  quantity: number;
  /** Pancartes de la demande qui reçoivent une unité (max 1 unité par pancarte) */
  frameUids: string[];
  /** Unités restantes destinées à une pancarte déjà sur place */
  onSiteCount: number;
} & ({ addon: Exclude<Addon, 'other'> } | { addon: 'other'; mention: string });

export interface InstallationDetails {
  frames: FramesDetails | null;
  addons: AddonAssignment[] | null;
}