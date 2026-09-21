import { Service } from "./services";
export type ServiceTypeChoice = 'installation' | 'removal' | 'correction' | null;

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

export function createAddress(baseAddr: StreetAddress | TerrainAddress): Address {
  return {
    ...baseAddr,
    id: crypto.randomUUID(),
    services: [],
  };
}