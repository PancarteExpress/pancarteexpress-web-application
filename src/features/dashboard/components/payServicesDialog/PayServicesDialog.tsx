'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { FaRegCheckCircle } from 'react-icons/fa';
import { formatCents } from '@/lib/pricing/money';
import type { ServicesPaymentResult } from '@/lib/orders/server/servicesPayment.actions';
import styles from './PayServicesDialog.module.css';
import { useCardPayment } from '@/shared/hooks/useCardPayment';
import { stripePromise } from '@/shared/lib/stripeClient';
import { CardFields } from '@/shared/components/cardFields/CardFields';

export type ServicesPaymentReady = Extract<ServicesPaymentResult, { ok: true }>;

interface PayServicesDialogProps {
  payment: ServicesPaymentReady;
  onClose: () => void;
}

// Ouvre la modale dès son montage, sans useEffect
const openOnMount = (node: HTMLDialogElement | null) => {
  if (node && !node.open) node.showModal();
};

export function PayServicesDialog(props: PayServicesDialogProps) {
  return (
    <Elements stripe={stripePromise}>
      <PayServicesContent {...props} />
    </Elements>
  );
}

function PayServicesContent({ payment, onClose }: PayServicesDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { handleCardChange, isComplete, cardError, setCardError, confirmPayment } = useCardPayment();

  const [isPaying, setIsPaying] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isComplete) {
      setCardError('Veuillez compléter les informations de votre carte');
      return;
    }

    setSubmitError(null);
    setIsPaying(true);

    const user = session?.user;
    const result = await confirmPayment(payment.clientSecret, {
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      email: user?.email ?? undefined,
    });

    setIsPaying(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    setIsPaid(true);
    router.refresh(); // le statut passe à « payé » dès que le webhook l'a enregistré
  };

  const error = cardError ?? submitError;

  return (
    <dialog
      ref={openOnMount}
      className={styles.dialog}
      aria-labelledby="pay-services-title"
      onClose={onClose}
      // Échap ne doit pas fermer la modale pendant le paiement
      onCancel={(e) => isPaying && e.preventDefault()}
    >
      {isPaid ? (
        <div className={styles.success}>
          <FaRegCheckCircle className={styles.successIcon} aria-hidden="true" />
          <h2 id="pay-services-title" className={styles.title}>Paiement reçu</h2>
          <p className={styles.text}>
            Merci ! Le paiement des services de la commande n° {payment.orderNumber} a été reçu.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={onClose}>Fermer</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <h2 id="pay-services-title" className={styles.title}>
            Payer les services — commande n° {payment.orderNumber}
          </h2>

          <dl className={styles.summary}>
            <div><dt>Sous-total</dt><dd>{formatCents(payment.subtotal, 'fr')}</dd></div>
            <div><dt>TPS</dt><dd>{formatCents(payment.tps, 'fr')}</dd></div>
            <div><dt>TVQ</dt><dd>{formatCents(payment.tvq, 'fr')}</dd></div>
            <div className={styles.summaryTotal}><dt>Total</dt><dd>{formatCents(payment.total, 'fr')}</dd></div>
          </dl>

          <fieldset className={styles.card} disabled={isPaying}>
            <CardFields
              onFieldChange={handleCardChange}
              labels={{ cardNumber: 'Numéro de carte', expiry: 'Expiration', cvc: 'CVC' }}
              groupClassName={styles.formGroup}
            />
          </fieldset>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={isPaying}>
              Annuler
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isPaying}>
              {isPaying ? 'Paiement en cours…' : `Payer ${formatCents(payment.total, 'fr')}`}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}