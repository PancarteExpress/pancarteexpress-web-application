// features/services/hooks/useAddresses.ts
import { useAddressStore } from '../store/addressStore';

export function useAddresses() {
  return useAddressStore();
}