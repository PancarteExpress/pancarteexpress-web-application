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

export interface ServiceRequestCartItem extends CartItemBase {
  kind: 'serviceRequest';
  requestType: RequestType;
  addresses: Address[];
  /** Délai de réalisation, commun à toutes les adresses et tous les services de la demande */
  schedule: ServiceSchedule | null;
}

export type CartItem = ProductCartItem | ServiceRequestCartItem;

export type NewProductItem = Omit<ProductCartItem, 'id' | 'addedAt' | 'kind'>;
export type NewServiceRequestItem = Omit<ServiceRequestCartItem, 'id' | 'addedAt' | 'kind'>;