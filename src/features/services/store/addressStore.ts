import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address, StreetAddress, TerrainAddress } from '../types/address';
import { Service } from '../types/services';

const STORAGE_VERSION = 1;

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  ownerId: string | null;
  syncOwner: (userId: string | null) => void;
  addAddress: (address: StreetAddress | TerrainAddress) => string;
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
      ownerId: null,

      // NOUVEAU : même règle que le panier
      syncOwner: (userId) =>
        set((state) => {
          if (state.ownerId === userId) return state;
          if (state.ownerId === null) return { ownerId: userId };
          return { addresses: [], selectedAddressId: null, ownerId: userId };
        }),

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
        return id;
      },

      removeAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
          selectedAddressId: state.selectedAddressId === id ? null : state.selectedAddressId,
        }));
      },

      updateAddress: (id, updatedAddress) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...updatedAddress, id, services: addr.services || [] } : addr,
          ),
        }));
      },

      addServiceToAddress: (addressId, service) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId ? { ...addr, services: [...(addr.services || []), service] } : addr,
          ),
        }));
      },

      removeServiceFromAddress: (addressId, serviceId) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId
              ? { ...addr, services: (addr.services || []).filter((s) => s.id !== serviceId) }
              : addr,
          ),
        }));
      },

      getAddresses: () => get().addresses,

      clearAddresses: () => {
        set({ addresses: [], selectedAddressId: null });
      },

      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
    }),
    {
      name: 'address-storage',
      version: STORAGE_VERSION,

      // Brouillons sauvegardés avant (version 0) : conservés, considérés comme invités
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AddressStore>;
        return version === 0 ? { ...state, ownerId: null } : state;
      },

      onRehydrateStorage: () => (state) => {
        if (state?.addresses) {
          state.addresses = state.addresses.map((addr) => ({
            ...addr,
            services: Array.isArray(addr.services) ? addr.services : [],
          }));
        }
      },
    },
  ),
);