'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaShoppingCart } from 'react-icons/fa';
import { useCartStore } from '@/features/cart/store/cartStore';
import type { NewProductItem } from '@/features/cart/types/cart';
import styles from './Shop.module.css';

const CONFIRMATION_MS = 1500;

interface Props {
  item: Omit<NewProductItem, 'quantity'>;
  addLabel: string;
  addedLabel: string;
}

export default function AddToCartButton({ item, addLabel, addedLabel }: Props) {
  const addProduct = useCartStore((s) => s.addProduct);
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Évite un setState après démontage si l'utilisateur quitte la page pendant la confirmation
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleClick = () => {
    addProduct({ ...item, quantity: 1 });
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdded(false), CONFIRMATION_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${styles.cartButton} ${added ? styles.added : ''}`}
        aria-label={addLabel}
      >
        {added ? <FaCheck size={18} aria-hidden="true" /> : <FaShoppingCart size={18} aria-hidden="true" />}
      </button>
      {/* Annonce la confirmation aux lecteurs d'écran */}
      <span role="status" className={styles.srOnly}>
        {added ? addedLabel : ''}
      </span>
    </>
  );
}