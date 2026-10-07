'use client';

import Link from 'next/link';
import { useRef, useState, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { loadStripe, type StripeElementStyle } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaRegCheckCircle } from 'react-icons/fa';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import type { ParsedAddress } from '@/shared/types/address';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCents } from '@/lib/pricing/money';
import { checkoutSchema, type CheckoutInput } from '../../types';
import {
  buildCheckoutPayload,
  submitCheckout,
  CheckoutApiError,
  type CheckoutErrorCode,
} from '../../services/checkoutApi';
import styles from './CheckoutView.module.css';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const CARD_STYLE: StripeElementStyle = {
  base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#9ca3af' } },
  invalid: { color: '#fa755a' },
};

type CardField = 'number' | 'expiry' | 'cvc';

const ERROR_MESSAGES: Record<CheckoutErrorCode, string> = {
  validationFailed: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  productUnavailable: 'Certains produits ne sont plus disponibles. Retirez-les de votre panier.',
  alreadyProcessed: 'Cette commande a déjà été traitée.',
  inProgress: 'Votre commande est en cours de traitement. Patientez quelques secondes, puis réessayez.',
  network: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.',
  serverError: 'Une erreur est survenue. Réessayez dans quelques instants.',
};

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { items, hasHydrated, clear } = useCart();

  const hasProducts = items.some((i) => i.kind === 'product');
  const requiresPayment = !isAuthenticated && hasProducts;

  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    handleSubmit,
    control,
    watch,
    clearErrors,
    setError, // NOUVEAU
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '', // NOUVEAU
      deliveryMode: 'pickup',
      shippingAddress: null,
    },
    values:
      isAuthenticated && session?.user
        ? {
            firstName: session.user.firstName ?? '',
            lastName: session.user.lastName ?? '',
            email: session.user.email ?? '',
            phone: '', // NOUVEAU : connecté, le serveur prend le téléphone du compte
            deliveryMode: 'pickup',
            shippingAddress: null,
          }
        : undefined,
    // Ne remplace pas ce que l'utilisateur a déjà modifié
    resetOptions: { keepDirtyValues: true },
  });

  const [addressText, setAddressText] = useState('');
  const deliveryMode = watch('deliveryMode');

  const deliveryModeField = register('deliveryMode', {
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === 'pickup') clearErrors('shippingAddress');
    },
  });

  const [cardComplete, setCardComplete] = useState<Record<CardField, boolean>>({
    number: false,
    expiry: false,
    cvc: false,
  });
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardChange =
    (field: CardField) => (event: { complete: boolean; error?: { message?: string } }) => {
      setCardComplete((prev) => ({ ...prev, [field]: event.complete }));
      setCardError(event.error?.message ?? null);
    };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ mode: 'submitted' | 'payment'; orderNumber: number } | null>(null);

  // Même contenu = même clé (pas de doublon en cas de nouvel essai)
  const attemptRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const getIdempotencyKey = (fingerprint: string): string => {
    if (attemptRef.current?.fingerprint !== fingerprint) {
      attemptRef.current = { fingerprint, key: crypto.randomUUID() };
    }
    return attemptRef.current.key;
  };

  const onSubmit = async (data: CheckoutInput) => {
    setSubmitError(null);

    // NOUVEAU : un invité doit laisser un téléphone
    if (!isAuthenticated && !data.phone) {
      setError('phone', { message: 'Le téléphone est requis' });
      return;
    }

    const cardElement = elements?.getElement(CardNumberElement) ?? null;

    if (requiresPayment) {
      if (!(cardComplete.number && cardComplete.expiry && cardComplete.cvc)) {
        setCardError('Veuillez compléter les informations de votre carte');
        return;
      }
      // Vérifié AVANT l'appel API : on ne crée pas une commande qu'on ne pourrait pas payer
      if (!stripe || !cardElement) {
        setSubmitError('Un paiement est requis, mais le module de paiement est indisponible. Rechargez la page.');
        return;
      }
    }

    try {
      const fingerprint = JSON.stringify(buildCheckoutPayload(data, items, ''));
      const payload = buildCheckoutPayload(data, items, getIdempotencyKey(fingerprint));
      const response = await submitCheckout(payload);

      if (response.mode === 'submitted') {
        setConfirmation({ mode: 'submitted', orderNumber: response.orderNumber });
        clear();
        return;
      }

      if (!stripe || !cardElement) {
        setSubmitError('Votre session a expiré. Rechargez la page pour continuer.');
        return;
      }

      const result = await stripe.confirmCardPayment(response.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone || undefined, // NOUVEAU
          },
        },
      });

      if (result.error) {
        setSubmitError(result.error.message ?? 'Le paiement a été refusé.');
        return;
      }

      if (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing') {
        setConfirmation({ mode: 'payment', orderNumber: response.orderNumber });
        clear();
        return;
      }

      setSubmitError("Le paiement n'a pas pu être confirmé. Réessayez.");
    } catch (error) {
      setSubmitError(error instanceof CheckoutApiError ? ERROR_MESSAGES[error.code] : ERROR_MESSAGES.serverError);
    }
  };

  const firstError =
    errors.firstName?.message ||
    errors.lastName?.message ||
    errors.email?.message ||
    errors.phone?.message || // NOUVEAU
    errors.shippingAddress?.message ||
    cardError ||
    submitError;

  /*if (confirmation) {
    const paid = confirmation.mode === 'payment';
    return (
      <div className={styles.mainContainer}>
        <div className={styles.completedPayment}>
          <div>
            <FaRegCheckCircle />
          </div>
          <p>
            {paid ? 'Votre paiement a été reçu. ' : 'Votre commande a été envoyée. '}
            Commande n° <strong>{confirmation.orderNumber}</strong>.
            <br />
            {isAuthenticated
              ? 'Vous pouvez suivre son statut dans votre tableau de bord.'
              : 'Nous vous contacterons par courriel pour la suite.'}
          </p>
          <Link href={isAuthenticated ? `/${locale}/dashboard` : `/${locale}/shop`}>
            {isAuthenticated ? 'Voir mes commandes' : 'Retour à la boutique'}
          </Link>
        </div>
      </div>
    );
  }*/

  if (!hasHydrated) return <div className={styles.mainContainer} />;

  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>
        {!confirmation && 
        <div className={styles.items}>
          <h3>{t('cartSummary')}</h3>
          {items.map((item) =>
            item.kind === 'product' ? (
              <div key={item.id} className={styles.item}>
                <span>{locale === 'en' ? item.nameEn || item.nameFr : item.nameFr}</span>
                <span>×{item.quantity}</span>
                <span>{formatCents(item.unitPrice * item.quantity, locale)}</span>
              </div>
            ) : (
              <div key={item.id} className={styles.item}>
                <span>{tCart(`requestType.${item.requestType}`)}</span>
                <span />
                <span>{tCart('priceOnQuote')}</span>
              </div>
            ),
          )}
        </div>}

        {confirmation && (
          <div className={styles.completedPayment}>
            <div>
              <FaRegCheckCircle />
            </div>
            <p>
              Commande n° <strong>{confirmation.orderNumber}</strong>.
              <br />
              {confirmation.mode === 'payment' ? 'Votre paiement a été reçu. ' : 'Votre commande a été envoyée. '}
              
              <br />
              {isAuthenticated
                ? 'Vous pouvez suivre son statut dans votre tableau de bord.'
                : 'Nous vous contacterons par courriel pour la suite.'}
            </p>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.section}>
            <h3>{t('paymentData')}</h3>

            <div className={styles.name}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">{t('firstname')}</label>
                <input id="firstName" {...register('firstName')} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName">{t('lastname')}</label>
                <input id="lastName" {...register('lastName')} />
              </div>
            </div>

            <div className={styles.name}>
            <div className={styles.formGroup}>
              <label htmlFor="email">{t('email')}</label>
              <input id="email" type="email" {...register('email')} readOnly={isAuthenticated} />
            </div>

            {!isAuthenticated && (
              <div className={styles.formGroup}>
                <label htmlFor="phone">{t('phone')}</label>
                <input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
              </div>
            )}
            </div>
          </div>

          {requiresPayment && (
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label>{t('cardNumber')}</label>
                <CardNumberElement options={{ style: CARD_STYLE }} onChange={handleCardChange('number')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label>{t('expiry')}</label>
                  <CardExpiryElement options={{ style: CARD_STYLE }} onChange={handleCardChange('expiry')} />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('cvc')}</label>
                  <CardCvcElement options={{ style: CARD_STYLE }} onChange={handleCardChange('cvc')} />
                </div>
              </div>
            </div>
          )}

          {hasProducts && (
            <div className={styles.section}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input className={styles.radioInput} type="radio" value="pickup" {...deliveryModeField} />
                  <div className={styles.radioButton} style={{ borderRadius: '10px 0 0 10px' }}>
                    {t('pickup')}
                  </div>
                </label>

                <label className={styles.radioLabel}>
                  <input className={styles.radioInput} type="radio" value="delivery" {...deliveryModeField} />
                  <div className={styles.radioButton} style={{ borderRadius: '0 10px 10px 0' }}>
                    {t('delivery')}
                  </div>
                </label>
              </div>

              {deliveryMode === 'pickup' && (
                <div className={styles.formGroup}>
                  <label>{t('pickupAddress')}</label>
                  {t('pickupInfo')}
                </div>
              )}

              {deliveryMode === 'delivery' && (
                <div className={styles.formGroup}>
                  <label htmlFor="delivery-address">{t('shippingAddress')}</label>
                  <Controller
                    name="shippingAddress"
                    control={control}
                    render={({ field }) => (
                      <AddressAutocomplete
                        id="delivery-address"
                        value={addressText}
                        onChange={setAddressText}
                        onSelect={(address: ParsedAddress | null) =>
                          field.onChange(
                            address
                              ? {
                                  street: `${address.streetNumber} ${address.streetName}`.trim(),
                                  city: address.city,
                                  postalCode: address.postalCode,
                                  province: address.province,
                                }
                              : null,
                          )
                        }
                      />
                    )}
                  />
                </div>
              )}
            </div>
          )}

          <div className={styles.section}>
            
            {firstError && <div className={styles.error}>{firstError}</div>}

            {!confirmation &&
            <button type="submit" disabled={items.length === 0 || isSubmitting}>
              {isSubmitting ? 'Envoi en cours…' : requiresPayment ? t('makePay') : t('submitOrder')}
            </button>
            }

            {confirmation && 
            <Link href={isAuthenticated ? `/${locale}/dashboard` : `/${locale}/shop`}>
              {isAuthenticated ? 'Voir mes commandes' : 'Retour à la boutique'}
            </Link>}
          </div>

          
        </form>
      </div>
    </div>
  );
}