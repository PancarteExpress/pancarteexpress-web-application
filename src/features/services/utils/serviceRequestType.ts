import { LARGE_FORMAT_SERVICES } from '../constants/largeFormat';
import type { Address } from '../types/address';
import type { LargeFormatService, RequestType, Service } from '../types/services';

const LARGE_FORMAT_SET: ReadonlySet<string> = new Set(LARGE_FORMAT_SERVICES);

/** Type de demande d'un service, déduit de son type : tout service « large… » est grand format */
export const requestTypeOf = (service: Pick<Service, 'type'>): RequestType =>
  LARGE_FORMAT_SET.has(service.type) ? 'commercial' : 'residential';

/** Garde de type : le service est-il grand format ? */
export const isLargeFormatService = (service: Service): service is Service & LargeFormatService =>
  LARGE_FORMAT_SET.has(service.type);

/** Adresses ayant des services de ce type de demande, avec uniquement ces services */
export function addressesWithServicesOf(addresses: readonly Address[], requestType: RequestType): Address[] {
  return addresses
    .map((a) => ({ ...a, services: a.services.filter((s) => requestTypeOf(s) === requestType) }))
    .filter((a) => a.services.length > 0);
}