import { REQUEST_TYPES } from "@/lib/orders/constants";
import type { InstallationDetails } from './installation';
import type { RemovalDetails } from './removal';
import type { CorrectionDetails } from './correction';
import type { PickupDetails } from './pickup';

export interface Installation extends InstallationDetails {
  type: 'installation';
}

export interface Removal extends RemovalDetails {
  type: 'removal';
}

export interface Pickup extends PickupDetails {
  type: 'pickup';
}

export type Correction = { type: 'correction' } & CorrectionDetails;

export type Service = (Installation | Removal | Correction | Pickup) & { id: string };
export type RequestType = (typeof REQUEST_TYPES)[number];