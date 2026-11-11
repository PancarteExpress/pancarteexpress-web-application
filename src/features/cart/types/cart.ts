import type { Address } from '@/features/services/types/address';
import type { ServiceSchedule } from '@/features/services/types/schedule';
import type { RequestType } from '@/features/services/types/services';

interface CartItemBase {
  id: string;
  addedAt: number;
}

export interface ProductCartItem extends CartItemBase {
  kind: 'product';
  productId: string;
  nameFr: string;
  nameEn: string;
  imageUrl: string | null;
  unitPrice: number; // cents, affichage seulement
  quantity: number;
}

/**
 * Adresse dans le panier : son délai est validé (null pour le grand format, sans délai).
 * Le brouillon de délai (scheduleDraft) est retiré avant l'ajout au panier.
 */
export type CartAddress = Address & { schedule: ServiceSchedule | null };

export interface ServiceRequestCartItem extends CartItemBase {
  kind: 'serviceRequest';
  requestType: RequestType;
  /** Chaque adresse a son propre délai */
  addresses: CartAddress[];
}

export type CartItem = ProductCartItem | ServiceRequestCartItem;

export type NewProductItem = Omit<ProductCartItem, 'id' | 'addedAt' | 'kind'>;
export type NewServiceRequestItem = Omit<ServiceRequestCartItem, 'id' | 'addedAt' | 'kind'>;