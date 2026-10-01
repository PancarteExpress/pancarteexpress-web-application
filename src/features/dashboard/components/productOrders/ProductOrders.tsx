'use client';

import styles from './ProductOrders.module.css';

export default function ProductOrders() {
  // Données hardcodées pour démonstration
  const orders = [
    {
      id: '1',
      orderNumber: '001',
      shippingAddress: '123 Rue St-Laurent, Montréal',
      status: 'pending',
      isPaid: false,
      items: [
        { id: '1', product: { name_fr: 'Panneau Immobilier Standard' }, quantity: 2 },
        { id: '2', product: { name_fr: 'Support Magnétique' }, quantity: 1 },
      ],
    },
    {
      id: '2',
      orderNumber: '002',
      shippingAddress: null,
      status: 'done',
      isPaid: true,
      items: [
        { id: '3', product: { name_fr: 'Panneau Premium' }, quantity: 1 },
      ],
    },
    {
      id: '3',
      orderNumber: '003',
      shippingAddress: '456 Rue de Bleury, Montréal',
      status: 'canceled',
      isPaid: false,
      items: [
        { id: '4', product: { name_fr: 'Cadre Aluminium' }, quantity: 3 },
      ],
    },
  ];

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
        <p>Aucune commande</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className={styles.order}>
            <div>
              <span className={styles.orderNum}>#{order.orderNumber}</span>
              <span className={styles.orderAddr}>
                {order.shippingAddress
                  ? `Sera livré au ${order.shippingAddress}`
                  : 'Ramassage au 2160 rue léger'}
              </span>
            </div>

            <div>
              <h1>
                <span className={styles.seeDetails}>Voir</span>
              </h1>

              <h1>
                {order.status === 'pending' && (
                  <span className={styles.pending}>En traitement</span>
                )}
                {order.status === 'canceled' && (
                  <span className={styles.canceled}>Annulée</span>
                )}
                {order.status === 'done' && (
                  <span className={styles.done}>Complétée</span>
                )}
              </h1>

              <h1>
                {order.status !== 'canceled' &&
                  (order.isPaid ? (
                    <span className={styles.isPayed}>Paiement fait</span>
                  ) : (
                    <span className={styles.isNotPayed}>Faire un paiement</span>
                  ))}
              </h1>
            </div>

            <div>
              <h1>
                {order.status !== 'canceled' &&
                  (order.isPaid ? (
                    <span className={styles.isPayed}>Paiement fait</span>
                  ) : (
                    <button className={styles.isNotPayed}>
                      Faire un paiement
                    </button>
                  ))}
              </h1>
            </div>
          </div>
        ))
      )}
    </div>
  );
}