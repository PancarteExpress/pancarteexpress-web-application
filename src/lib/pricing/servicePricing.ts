import { SERVICE_PRICES, type PricedServiceType } from './constants';

export interface PricedService {
  type: PricedServiceType;
}

export interface PricedServiceAddress {
  services: readonly PricedService[];
}

export const calculateServicePrice = (service: PricedService): number =>
  SERVICE_PRICES[service.type];

/** 1 service × 1 adresse = 1 prix unitaire */
export const calculateServiceRequestPrice = (addresses: readonly PricedServiceAddress[]): number =>
  addresses.reduce(
    (sum, address) => sum + address.services.reduce((s, svc) => s + calculateServicePrice(svc), 0),
    0,
  );