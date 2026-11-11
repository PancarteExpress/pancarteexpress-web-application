import type { Service } from "./services";
import type { ScheduleFormValues } from "../schemas/schedule.schema";

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
  /** Délai résidentiel tel que saisi (validé à l'ajout au panier) ; absent = « Standard 24 h » */
  scheduleDraft?: ScheduleFormValues;
};

// Factory functions
export function createStreetAddress(data: Omit<StreetAddress, 'type'>): StreetAddress {
  return { type: 'address', ...data };
}

export function createTerrainAddress(data: Omit<TerrainAddress, 'type'>): TerrainAddress {
  return { type: 'terrain', ...data };
}