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
const STORAGE_VERSION = 2;

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

      // NOUVEAU : décide si le panier est conservé ou vidé selon l'utilisateur courant
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

      // Ce qui est sauvegardé dans le localStorage : maintenant avec ownerId
      partialize: (state): PersistedCart => ({ items: state.items, ownerId: state.ownerId }),

      // Paniers déjà sauvegardés en v1 : conservés, considérés comme invités
      migrate: (persisted, version): PersistedCart => {
        if (version === 1) {
          const items = (persisted as { items?: unknown } | undefined)?.items;
          return { items: Array.isArray(items) ? (items as CartItem[]) : [], ownerId: null };
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