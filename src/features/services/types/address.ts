import { Service } from "./services";

// Type "address"
export interface StreetAddress {
  type: 'address';
  streetNumber: string;
  streetName: string;
  apartment?: string;
  city: string;
  postalCode: string;
}

// Type "terrain"
export interface TerrainAddress {
  type: 'terrain';
  description: string;
  city: string;
  nearbyAddress?: string;
}

export type Address = (StreetAddress | TerrainAddress) & {
  id: string;
  services: Service[];
};

// Factory functions
export function createStreetAddress(data: Omit<StreetAddress, 'type'>): StreetAddress {
  return { type: 'address', ...data };
}

export function createTerrainAddress(data: Omit<TerrainAddress, 'type'>): TerrainAddress {
  return { type: 'terrain', ...data };
}