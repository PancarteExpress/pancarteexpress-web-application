'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/features/cart/store/cartStore';
import { useAddressStore } from '@/features/services/store/addressStore';

export default function StorageOwnerSync() {
  const { data: session, status } = useSession();
  const cartHydrated = useCartStore((s) => s.hasHydrated);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    // On attend que la session soit connue ET que le panier soit chargé
    if (status === 'loading' || !cartHydrated) return;

    useCartStore.getState().syncOwner(userId);
    useAddressStore.getState().syncOwner(userId);
  }, [status, userId, cartHydrated]);

  return null; // aucun affichage
}