import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { calculateTotals } from '@/lib/pricing/calculateTotals';
import { useCartStore } from '../store/cartStore';

export function useCart() {
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  // useShallow : évite une boucle de re-render en sélectionnant un objet
  const actions = useCartStore(
    useShallow((s) => ({
      addProduct: s.addProduct,
      addServiceRequest: s.addServiceRequest,
      updateQuantity: s.updateQuantity,
      removeItem: s.removeItem,
      clear: s.clear,
    })),
  );

  const summary = useMemo(() => {
    const productLines = items.flatMap((i) =>
      i.kind === 'product' ? [{ unitPrice: i.unitPrice, quantity: i.quantity }] : [],
    );
    const serviceRequests = items.flatMap((i) =>
      i.kind === 'serviceRequest' ? [{ addresses: i.addresses }] : [],
    );

    return {
      // Estimation : la livraison est choisie au checkout
      estimate: calculateTotals({ productLines, serviceRequests, fulfillmentMethod: null }),
      itemCount: items.reduce((n, i) => n + (i.kind === 'product' ? i.quantity : 1), 0),
      hasProducts: productLines.length > 0,
      hasServices: serviceRequests.length > 0,
    };
  }, [items]);

  return { items, hasHydrated, ...actions, ...summary };
}

/** Pour le header : ne re-render que si le nombre change */
export const useCartItemCount = (): number =>
  useCartStore((s) => s.items.reduce((n, i) => n + (i.kind === 'product' ? i.quantity : 1), 0));