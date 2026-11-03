import { REQUEST_TYPES } from "@/lib/orders/constants";
import type { InstallationDetails } from './installation';
import type { RemovalDetails } from './removal';

export interface Installation extends InstallationDetails {
  type: 'installation';
}

export interface Removal extends RemovalDetails {
  type: 'removal';
}

export interface Correction {
  type: 'correction';
  specialInstructions?: string;
}

export type Service = (Installation | Removal | Correction) & { id: string };
export type RequestType = (typeof REQUEST_TYPES)[number];