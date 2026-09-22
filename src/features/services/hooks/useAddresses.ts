// features/services/hooks/useAddresses.ts
import { useAddressStore } from '../store/addressStore';

export function useAddresses() {
  const store = useAddressStore();
  
  return {
    ...store,
    addresses: store.addresses.map(addr => ({
      ...addr,
      services: addr.services || [],
    })),
  };
}