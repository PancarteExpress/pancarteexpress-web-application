import type { AttachmentContentType } from '@/lib/attachments/constants';
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
  attachments?: AttachmentInfo[];
};

/** Pièce jointe déjà envoyée au stockage privé ; seules ses informations sont gardées ici */
export interface AttachmentInfo {
  /** Chemin dans le stockage privé (ex. attachments/plan-x7Kq2.pdf) */
  pathname: string;
  /** Nom d'origine, pour l'affichage */
  fileName: string;
  contentType: AttachmentContentType;
  /** Taille en octets */
  size: number;
}

// Factory functions
export function createStreetAddress(data: Omit<StreetAddress, 'type'>): StreetAddress {
  return { type: 'address', ...data };
}

export function createTerrainAddress(data: Omit<TerrainAddress, 'type'>): TerrainAddress {
  return { type: 'terrain', ...data };
}