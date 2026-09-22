import type { Address } from '../types/address';

interface AddressLabels {
  terrain: string;
  near: string;
  apartment: string;
}

export function formatAddress(address: Address, labels: AddressLabels): string {
  switch (address.type) {
    case 'address': {
      const apt = address.apartment ? `, ${labels.apartment} ${address.apartment}` : '';
      return `${address.streetNumber} ${address.streetName}${apt}, ${address.city}`;
    }
    case 'terrain': {
      const near = address.nearbyAddress ? ` (${labels.near} ${address.nearbyAddress})` : '';
      return `${labels.terrain}, ${address.city}${near}`;
    }
    default: {
      const exhaustive: never = address;
      return exhaustive;
    }
  }
}