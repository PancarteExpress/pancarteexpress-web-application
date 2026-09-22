import { REQUEST_TYPES } from "@/lib/constants/services";

export interface Installation {
  type: 'installation';
  items: {
    frames: { selected: boolean; details?: Record<string, unknown> };
    anchors: { selected: boolean; details?: Record<string, unknown> };
    poles: { selected: boolean; details?: Record<string, unknown> };
    addonsOpenHouse: { selected: boolean; details?: Record<string, unknown> };
    addons: { selected: boolean; details?: Record<string, unknown> };
    keybox: { selected: boolean; details?: Record<string, unknown> };
    flags: { selected: boolean; details?: Record<string, unknown> };
    directional: { selected: boolean; details?: Record<string, unknown> };
    other: { selected: boolean; details?: Record<string, unknown> };
  };
  accessibility: 'ground' | 'wall' | 'fence' | 'ramp' | 'balcony' | 'other' | null;
  specialAccess: 'ladder' | 'bigLadder' | 'noLadder' | 'appointmnet' | null;
}

export interface Removal {
  type: 'removal';
  specialInstructions?: string;
}

export interface Correction {
  type: 'correction';
  specialInstructions?: string;
}

export type Service = (Installation | Removal | Correction) & { id: string };
export type RequestType = (typeof REQUEST_TYPES)[number];

export function createInstallation(
  data: Omit<Installation, 'type' | 'id'>
): Service {
  return {
    type: 'installation',
    id: crypto.randomUUID(),
    ...data,
  };
}

export function createRemoval(data: Omit<Removal, 'type' | 'id'>): Service {
  return {
    type: 'removal',
    id: crypto.randomUUID(),
    ...data,
  };
}

export function createCorrection(data: Omit<Correction, 'type' | 'id'>): Service {
  return {
    type: 'correction',
    id: crypto.randomUUID(),
    ...data,
  };
}