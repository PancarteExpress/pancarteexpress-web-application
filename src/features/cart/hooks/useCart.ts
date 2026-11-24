import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { calculateTotals } from '@/lib/pricing/calculateTotals';
import { getProductBySlug } from '@/lib/catalog/catalog';
import { useCartStore } from '../store/cartStore';
import { isSelectableSpecificDate } from '@/features/services/utils/holidays';

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
    const productItems = items.filter((i) => i.kind === 'product');

    // Prix actuel du catalogue, comme au checkout : jamais le prix figé dans le localStorage
    const productLines = productItems.flatMap((i) => {
      const product = getProductBySlug(i.productId);
      return product ? [{ unitPrice: product.price, quantity: i.quantity }] : [];
    });

    // Retirés du catalogue ou désactivés : le checkout les refuserait
    const unavailableProductIds = productItems
      .filter((i) => !getProductBySlug(i.productId))
      .map((i) => i.productId);

    // Date précise dépassée depuis l'ajout au panier : le checkout la refuserait
    const expiredServiceRequestIds = items.flatMap((i) =>
      i.kind === 'serviceRequest' &&
      i.addresses.some((a) => a.schedule?.delay === 'specificDate' && !isSelectableSpecificDate(a.schedule.date ?? ''))
        ? [i.id]
        : [],
    );

    return {
      // Estimation : seuls les produits ont un prix
      estimate: calculateTotals(productLines),
      itemCount: items.reduce((n, i) => n + (i.kind === 'product' ? i.quantity : 1), 0),
      hasProducts: productItems.length > 0,
      hasServices: items.some((i) => i.kind === 'serviceRequest'),
      unavailableProductIds,
      expiredServiceRequestIds
    };
  }, [items]);

  return { items, hasHydrated, ...actions, ...summary };
}