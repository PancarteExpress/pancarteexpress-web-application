import { REQUEST_TYPES } from "@/lib/orders/constants";
import type { InstallationDetails } from './installation';
import type { RemovalDetails } from './removal';
import type { CorrectionDetails } from './correction';
import type { PickupDetails } from './pickup';
import type { LargeInstallationDetails, LargeRetrievalDetails, LargeStoragePickupDetails } from './largeFormat';

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

/* ---------- Grand format ---------- */
export type LargeInstallation = { type: 'largeInstallation' } & LargeInstallationDetails;
export interface LargeStoragePickup extends LargeStoragePickupDetails {
  type: 'largeStoragePickup';
}
export type LargeRetrieval = { type: 'largeRetrieval' } & LargeRetrievalDetails;

export type ResidentialService = Installation | Removal | Correction | Pickup;
export type LargeFormatService = LargeInstallation | LargeStoragePickup | LargeRetrieval;

export type Service = (ResidentialService | LargeFormatService) & { id: string };
export type RequestType = (typeof REQUEST_TYPES)[number];