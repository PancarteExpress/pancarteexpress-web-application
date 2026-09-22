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
const STORAGE_VERSION = 1;

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
}

interface CartState extends PersistedCart {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
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
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

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
              // Copie profonde : le formulaire peut évoluer sans affecter le panier
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
      partialize: (state): PersistedCart => ({ items: state.items }),
      // Point d'entrée des futures évolutions du format (v2 : modification des services, etc.)
      migrate: (persisted, version): PersistedCart => {
        if (version !== STORAGE_VERSION) return { items: [] };
        return persisted as PersistedCart;
      },
      merge: (persisted, current) => {
        const raw = (persisted as Partial<PersistedCart> | undefined)?.items;
        return { ...current, items: Array.isArray(raw) ? raw.filter(isCartItem) : [] };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('[cart] Échec de réhydratation', error);
        // Même en cas d'erreur, on débloque l'UI (le panier sera simplement vide)
        state?.setHasHydrated(true);
      },
    },
  ),
);