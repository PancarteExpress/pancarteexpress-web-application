'use client';

import { UserProductOrder } from '@/lib/orders/server/orders.service';
import styles from './ProductOrders.module.css';

interface Props {
  orders: UserProductOrder[];
}

type DisplayState = 'pending' | 'done' | 'canceled';

// Traduit les statuts de la BD vers les 3 états affichés
function getDisplayState(order: UserProductOrder): DisplayState {
  if (order.status === 'CANCELLED') return 'canceled';
  if (order.status === 'COMPLETED' || order.productsStatus === 'DELIVERED') return 'done';
  return 'pending';
}

export default function ProductOrders({ orders }: Props) {

  return (
    <div className={styles.shopOrders}>
      <h3 className={styles.title}>Commandes de produits de la boutique</h3>

      <div className={styles.header}>
        <div>
          <span>Commande</span>
        </div>
        <div>
          <span>Détails</span>
          <span>État</span>
          <span>Payment</span>
        </div>
      </div>

      {orders.length === 0 ? (
      
      <div className={styles.noOrders}>Aucune commande</div>

      ) : (
        orders.map((order) => {
          const state = getDisplayState(order);
          const isPaid = order.paidAt !== null;

          return (
            <div key={order.id} className={styles.order}>
              <div>
                <span className={styles.orderNum}>#{order.orderNumber}</span>
                <span className={styles.orderAddr}>
                  {order.deliveryMode === 'DELIVERY'
                    ? `Sera livré au ${order.deliveryStreet}, ${order.deliveryCity}`
                    : 'Ramassage au 2160 rue Léger'}
                </span>
              </div>

              <div>
                <h1>
                  <span className={styles.seeDetails}>Voir</span>
                </h1>

                <h1>
                  {state === 'pending' && <span className={styles.pending}>En traitement</span>}
                  {state === 'canceled' && <span className={styles.canceled}>Annulée</span>}
                  {state === 'done' && <span className={styles.done}>Complétée</span>}
                </h1>

                <h1>
                  {state !== 'canceled' &&
                    (isPaid ? (
                      <span className={styles.isPayed}>Paiement fait</span>
                    ) : (
                      <span className={styles.isNotPayed}>Faire un paiement</span>
                    ))}
                </h1>
              </div>

              <div>
                <h1>
                  {state !== 'canceled' &&
                    (isPaid ? (
                      <span className={styles.isPayed}>Paiement fait</span>
                    ) : (
                      <button className={styles.isNotPayed}>Faire un paiement</button>
                    ))}
                </h1>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}