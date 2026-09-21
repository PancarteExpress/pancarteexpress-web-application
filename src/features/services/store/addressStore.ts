// features/services/store/addressStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address, StreetAddress, TerrainAddress } from '../types/address';
import { Service } from '../types/services';


interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  addAddress: (address: StreetAddress | TerrainAddress) => void;
  removeAddress: (id: string) => void;
  updateAddress: (id: string, address: StreetAddress | TerrainAddress) => void;
  addServiceToAddress: (addressId: string, service: Service) => void;
  removeServiceFromAddress: (addressId: string, serviceId: string) => void;
  getAddresses: () => Address[];
  clearAddresses: () => void;
  setSelectedAddressId: (id: string | null) => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,

      addAddress: (address) => {
        const id = `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAddress: Address = {
          ...address,
          id,
          services: [],
        } as Address;
        set((state) => ({
          addresses: [...state.addresses, newAddress],
        }));
      },

      removeAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        }));
      },

      updateAddress: (id, updatedAddress) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? ({ ...updatedAddress, id } as Address) : addr
          ),
        }));
      },

      addServiceToAddress: (addressId, service) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId
              ? { ...addr, services: [...addr.services, service] }
              : addr
          ),
        }));
      },

      removeServiceFromAddress: (addressId, serviceId) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId
              ? { ...addr, services: addr.services.filter((s) => s.id !== serviceId) }
              : addr
          ),
        }));
      },

      getAddresses: () => {
        return get().addresses;
      },

      clearAddresses: () => {
        set({ addresses: [] });
      },

      setSelectedAddressId: (id) =>
        set({ selectedAddressId: id }),
    }),
    {
      name: 'address-storage',
    }
  )
);