import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CartItem,
  NewProductItem,
  NewServiceRequestItem,
  ProductCartItem,
} from '../types/cart';
import { MAX_QUANTITY } from '@/lib/constants/cart';

const STORAGE_KEY = 'pancarte-cart';
const STORAGE_VERSION = 4;

const clampQuantity = (q: number): number =>
  Number.isFinite(q) ? Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(q))) : 1;

// Le localStorage est modifiable par l'utilisateur : on ne garde que les items plausibles
const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string') return false;
  if (v.kind === 'product') return typeof v.productId === 'string' && typeof v.quantity === 'number';
  if (v.kind === 'serviceRequest') return Array.isArray(v.addresses);
  return false;
};

// v3 : installations dans un format antérieur ».
const stripLegacyInstallations = (items: CartItem[]): CartItem[] =>
  items.flatMap<CartItem>((item) => {
    if (item.kind !== 'serviceRequest') return [item];

    const addresses = item.addresses
      .map((a) => ({ ...a, services: (a.services ?? []).filter((s) => s.type !== 'installation') }))
      .filter((a) => a.services.length > 0);

    return addresses.length > 0 ? [{ ...item, addresses }] : [];
  });

interface PersistedCart {
  items: CartItem[];
  ownerId: string | null;
}

interface CartState extends PersistedCart {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  syncOwner: (userId: string | null) => void;
  addProduct: (item: NewProductItem) => void;
  addServiceRequest: (item: NewServiceRequestItem) => string;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      ownerId: null,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      // Décide si le panier est conservé ou vidé selon l'utilisateur courant
      syncOwner: (userId) =>
        set((state) => {
          if (state.ownerId === userId) return state; // même personne : rien ne change
          if (state.ownerId === null) return { ownerId: userId }; // invité qui se connecte : on garde
          return { items: [], ownerId: userId }; // autre personne : on vide
        }),

      addProduct: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i): i is ProductCartItem => i.kind === 'product' && i.productId === item.productId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...existing, quantity: clampQuantity(existing.quantity + item.quantity) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                kind: 'product',
                id: crypto.randomUUID(),
                addedAt: Date.now(),
                quantity: clampQuantity(item.quantity),
              },
            ],
          };
        }),

      addServiceRequest: (item) => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              kind: 'serviceRequest',
              id,
              addedAt: Date.now(),
              addresses: structuredClone(item.addresses),
            },
          ],
        }));
        return id;
      },

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.kind === 'product' ? { ...i, quantity: clampQuantity(quantity) } : i,
          ),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),

      // Ce qui est sauvegardé dans le localStorage
      partialize: (state): PersistedCart => ({ items: state.items, ownerId: state.ownerId }),

      migrate: (persisted, version): PersistedCart => {
        const p = persisted as { items?: unknown; ownerId?: unknown } | undefined;
        // Filtré d'abord : on ne manipule que des items plausibles
        const items = Array.isArray(p?.items) ? p.items.filter(isCartItem) : [];

        // v1 : conservé, considéré comme invité
        if (version === 1) return { items: stripLegacyInstallations(items), ownerId: null };
        // v2 : propriétaire conservé
        if (version === 2 || version === 3) {
          return {
            items: stripLegacyInstallations(items),
            ownerId: typeof p?.ownerId === 'string' ? p.ownerId : null,
          };
        }
        if (version !== STORAGE_VERSION) return { items: [], ownerId: null };
        return persisted as PersistedCart;
      },

      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedCart> | undefined;
        return {
          ...current,
          items: Array.isArray(p?.items) ? p.items.filter(isCartItem) : [],
          ownerId: typeof p?.ownerId === 'string' ? p.ownerId : null,
        };
      },

      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('[cart] Échec de réhydratation', error);
        state?.setHasHydrated(true);
      },
    },
  ),
);