import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address, StreetAddress, TerrainAddress } from '../types/address';
import type { RequestType, Service } from '../types/services';
import type { ScheduleFormValues } from '../schemas/schedule.schema';
import { upgradeInstallationDetails, upgradeInstallationFormValues } from '../utils/legacyInstallation';
import { requestTypeOf } from '../utils/serviceRequestType';
import type { InstallationFormValues } from '../schemas/installation.schema';
import type { RemovalFormValues } from '../schemas/removal.schema';
import type { CorrectionFormValues } from '../schemas/correction.schema';
import type { PickupFormValues } from '../schemas/pickup.schema';
import type { DeliveryFormValues } from '../schemas/delivery.schema';
import type {
  LargeInstallationFormValues, LargeRetrievalFormValues, LargeStoragePickupFormValues,
} from '../schemas/largeFormat.schema';
/** Service sans id : le store l'attribue (ou conserve celui du service existant) */
type ServiceInput = Service extends infer S ? (S extends unknown ? Omit<S, 'id'> : never) : never;

const STORAGE_VERSION = 5;

export type ServiceKey = Service['type'];

/** Valeurs du formulaire de chaque service, telles que saisies (incomplètes possibles) */
interface FormValuesByType {
  installation: InstallationFormValues;
  removal: RemovalFormValues;
  correction: CorrectionFormValues;
  pickup: PickupFormValues;
  delivery: DeliveryFormValues;
  largeInstallation: LargeInstallationFormValues;
  largeStoragePickup: LargeStoragePickupFormValues;
  largeRetrieval: LargeRetrievalFormValues;
}

/**
 * Brouillon d'un service : la saisie en cours, gardée dans le navigateur (jamais en base).
 * `complete` : la saisie est valide, et donc déjà enregistrée comme service.
 */
export interface ServiceDraft<K extends ServiceKey> {
  values: FormValuesByType[K];
  complete: boolean;
}

export type AddressDrafts = { [K in ServiceKey]?: ServiceDraft<K> };

/** Ce qui est gardé dans le navigateur : les données, sans les actions ni la demande d'erreurs */
type PersistedAddresses = Pick<AddressStore, 'addresses' | 'selectedAddressId' | 'ownerId' | 'drafts'>;

/** Retire des brouillons d'une adresse ceux qui ne passent pas le filtre */
const keepDrafts = (drafts: AddressDrafts | undefined, keep: (type: ServiceKey) => boolean): AddressDrafts => {
  const next: AddressDrafts = {};
  for (const [type, draft] of Object.entries(drafts ?? {}) as [ServiceKey, ServiceDraft<ServiceKey>][]) {
    if (keep(type)) Object.assign(next, { [type]: draft });
  }
  return next;
};

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
  clearServicesOf: (requestType: RequestType) => void;
  setSelectedAddressId: (id: string | null) => void;
  /** Délai résidentiel de l'adresse, tel que saisi */
  setAddressSchedule: (addressId: string, schedule: ScheduleFormValues) => void;
  
  saveService: (addressId: string, service: ServiceInput) => void;

  /** Brouillons par adresse (persistés dans le navigateur avec les adresses) */
  drafts: Record<string, AddressDrafts>;
  setDraft: <K extends ServiceKey>(addressId: string, type: K, draft: ServiceDraft<K>) => void;
  clearDraft: (addressId: string, type: ServiceKey) => void;

  /** Ajout au panier refusé : le formulaire de l'adresse sélectionnée affiche ses erreurs (non persisté) */
  validationRequest: number;
  requestValidation: () => void;
  clearValidationRequest: () => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      ownerId: null,
      drafts: {},
      validationRequest: 0,

      // NOUVEAU : même règle que le panier
      syncOwner: (userId) =>
        set((state) => {
          if (state.ownerId === userId) return state;
          if (state.ownerId === null) return { ownerId: userId };
          return { addresses: [], selectedAddressId: null, ownerId: userId, drafts: {} };
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
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[id];
          return {
            addresses: state.addresses.filter((addr) => addr.id !== id),
            selectedAddressId: state.selectedAddressId === id ? null : state.selectedAddressId,
            drafts,
          };
        });
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
        set((state) => {
          const type = state.addresses.find((a) => a.id === addressId)?.services.find((s) => s.id === serviceId)?.type;
          return {
            addresses: state.addresses.map((addr) =>
              addr.id === addressId
                ? { ...addr, services: (addr.services || []).filter((s) => s.id !== serviceId) }
                : addr,
            ),
            // Le brouillon du service supprimé disparaît avec lui
            drafts: type
              ? { ...state.drafts, [addressId]: keepDrafts(state.drafts[addressId], (t) => t !== type) }
              : state.drafts,
          };
        });
      },

      getAddresses: () => get().addresses,

      clearAddresses: () => {
        set({ addresses: [], selectedAddressId: null, drafts: {} });
      },

      clearServicesOf: (requestType) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            services: a.services.filter((s) => requestTypeOf(s) !== requestType),
            // Demande résidentielle envoyée au panier : la prochaine repart de « Standard 24 h »
            scheduleDraft: requestType === 'residential' ? undefined : a.scheduleDraft,
          })),
          selectedAddressId: null,
          // Brouillons de ce type de demande : envoyés au panier, ils n'ont plus lieu d'être
          drafts: Object.fromEntries(
            Object.entries(state.drafts).map(([id, d]) => [id, keepDrafts(d, (t) => requestTypeOf({ type: t }) !== requestType)]),
          ),
        }));
      },

      setSelectedAddressId: (id) => set({ selectedAddressId: id }),

      setAddressSchedule: (addressId, schedule) =>
        set((state) => ({
          addresses: state.addresses.map((a) => (a.id === addressId ? { ...a, scheduleDraft: schedule } : a)),
        })),

            saveService: (addressId, service) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => {
            if (addr.id !== addressId) return addr;

            const existing = addr.services.find((s) => s.type === service.type);
            const saved: Service = { ...service, id: existing?.id ?? crypto.randomUUID() };

            return {
              ...addr,
              services: existing
                ? addr.services.map((s) => (s.id === existing.id ? saved : s))
                : [...addr.services, saved],
            };
          }),
        }));
      },

      setDraft: (addressId, type, draft) =>
        set((state) => ({
          drafts: { ...state.drafts, [addressId]: { ...state.drafts[addressId], [type]: draft } },
        })),

      clearDraft: (addressId, type) =>
        set((state) => ({
          drafts: { ...state.drafts, [addressId]: keepDrafts(state.drafts[addressId], (t) => t !== type) },
        })),

      requestValidation: () => set((state) => ({ validationRequest: state.validationRequest + 1 })),
      clearValidationRequest: () => set({ validationRequest: 0 }),
    }),
    {
      name: 'address-storage',
      // La demande d'affichage des erreurs ne survit pas à un rechargement
      partialize: ({ addresses, selectedAddressId, ownerId, drafts }): PersistedAddresses =>
        ({ addresses, selectedAddressId, ownerId, drafts }),
      version: STORAGE_VERSION,

      // Brouillons sauvegardés avant (version 0) : conservés, considérés comme invités
      migrate: (persisted, version): PersistedAddresses => {
        let state = (persisted ?? {}) as Partial<PersistedAddresses>;
        if (version === 0) state = { ...state, ownerId: null };
        if (version < 3) {
          state = {
            ...state,
            addresses: (state.addresses ?? []).map((a) => ({
              ...a,
              services: (a.services ?? []).filter((s) => s.type !== 'installation'),
            })),
          };
        }
        // v4 : brouillons ; les versions antérieures n'en ont pas
        if (version < 4) state = { ...state, drafts: {} };
        // v5 : emplacement par élément de l'installation ; l'ancien emplacement unique est reporté sur chacun
        if (version < 5) {
          state = {
            ...state,
            addresses: (state.addresses ?? []).map((a) => ({
              ...a,
              services: (a.services ?? []).map((s) =>
                s.type === 'installation' ? (upgradeInstallationDetails(s) as Service) : s,
              ),
            })),
            drafts: Object.fromEntries(
              Object.entries(state.drafts ?? {}).map(([id, d]) => [
                id,
                d.installation
                  ? { ...d, installation: { ...d.installation, values: upgradeInstallationFormValues(d.installation.values) as InstallationFormValues } }
                  : d,
              ]),
            ),
          };
        }
        return {
          addresses: state.addresses ?? [],
          selectedAddressId: state.selectedAddressId ?? null,
          ownerId: state.ownerId ?? null,
          drafts: state.drafts ?? {},
        };
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