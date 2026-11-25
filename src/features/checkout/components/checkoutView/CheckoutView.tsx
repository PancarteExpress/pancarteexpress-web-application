'use client';

import styles from './CheckoutView.module.css';

import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import { LocalLink } from '@/shared/components/LocalLink';

import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { GUEST_INFO_LIMITS } from '@/lib/orders/guestInfo';
import type { ParsedAddress } from '@/shared/types/address';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCents } from '@/lib/pricing/money';
import { formatPhone } from '@/shared/utils/phone';
import { checkoutSchema, type CheckoutInput } from '../../schemas/checkout.schema';
import { useDelayText } from '@/features/cart/hooks/useDelayText';
import { useCardPayment } from '../../hooks/useCardPayment';
import { CardFields } from '../cardFields/CardFields';
import { stripePromise } from '../../services/stripeClient';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import { getProductBySlug } from '@/lib/catalog/catalog';

import { zodResolver } from '@hookform/resolvers/zod';
import { buildCheckoutPayload, submitCheckout, CheckoutApiError, type CheckoutErrorCode } from '../../services/checkoutApi';

import { FaRegCheckCircle } from 'react-icons/fa';
import { randomId } from '@/shared/utils/randomId';

export default function Checkout() {
  // Langue des messages de Stripe (carte incomplète, refusée…) : celle du site, pas celle du navigateur
  const stripeLocale = useLocale() === 'en' ? 'en' : 'fr-CA';

  return (
    <Elements stripe={stripePromise} options={{ locale: stripeLocale }}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const delayText = useDelayText(locale);
  const translateError = useIssueMessage('checkout.errors');
  const submitErrorMessage = (code: CheckoutErrorCode) => t(`submitErrors.${code}`);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { items, hasHydrated, clear, estimate, unavailableProductIds, expiredServiceRequestIds } = useCart();
  const router = useRouter();

  // Produit retiré du catalogue ou date dépassée : le serveur refuserait la commande
  const isBlocked = unavailableProductIds.length > 0 || expiredServiceRequestIds.length > 0;

  // Invité qui demande l'entreposage du matériel retiré : il doit ouvrir un compte après sa commande
  const needsAccountForStorage =
    !isAuthenticated &&
    items.some((item) =>
      item.kind === 'serviceRequest' &&
      item.addresses.some((a) => a.services.some((s) => s.type === 'removal' && s.afterRemoval?.choice === 'storage')),
    );

  /** Commande confirmée : confirmation sur place, ou inscription (avec le numéro) si l'entreposage est demandé */
  const completeOrder = (mode: 'submitted' | 'payment', orderNumber: number) => {
    // Lu avant de vider le panier : il n'y aura plus d'items ensuite
    const redirectToRegister = needsAccountForStorage;
    clear();
    if (redirectToRegister) {
      // Lu une seule fois par la page d'inscription : invisible pour qui tape l'URL à la main
      try {
        sessionStorage.setItem('storageOrder', String(orderNumber));
      } catch {
        // Stockage bloqué (navigation privée stricte) : la notice ne s'affichera pas, la commande est déjà envoyée
      }
      router.push(`/${locale}/register`);
      return;
    }
    setConfirmation({ mode, orderNumber });
  };

  const hasProducts = items.some((i) => i.kind === 'product');
  const requiresPayment = hasProducts;

  const { handleCardChange, isComplete, isReady, cardError, setCardError, confirmPayment } =
    useCardPayment();

  const {
    register,
    handleSubmit,
    control,
    watch,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      billingAddress: '',
      additionalInfo: '',
      deliveryMode: 'pickup',
      shippingAddress: null,
    },
    values:
      isAuthenticated && session?.user
        ? {
            firstName: session.user.firstName ?? '',
            lastName: session.user.lastName ?? '',
            email: session.user.email ?? '',
            phone: '', // connecté : le serveur prend le téléphone du compte
            companyName: '',
            billingAddress: '',
            additionalInfo: '',
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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ mode: 'submitted' | 'payment'; orderNumber: number } | null>(null);

  // Même contenu = même clé (pas de doublon en cas de nouvel essai)
  const attemptRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const getIdempotencyKey = (fingerprint: string): string => {
    if (attemptRef.current?.fingerprint !== fingerprint) {
      attemptRef.current = { fingerprint, key: randomId() };
    }
    return attemptRef.current.key;
  };

  const onSubmit = async (data: CheckoutInput) => {
    setSubmitError(null);

    // Un invité doit laisser un téléphone
    if (!isAuthenticated && !data.phone) {
      setError('phone', { message: 'phoneRequired' });
      return;
    }
    // Et son adresse de facturation
    if (!isAuthenticated && !data.billingAddress) {
      setError('billingAddress', { message: 'billingAddressRequired' });
      return;
    }

    if (requiresPayment) {
      if (!isComplete) {
        setCardError(t('errors.cardIncomplete'));
        return;
      }
      // Vérifié AVANT l'appel API : on ne crée pas une commande qu'on ne pourrait pas payer
      if (!isReady) {
        setSubmitError(t('errors.paymentModuleUnavailable'));
        return;
      }
    }

    try {
      const fingerprint = JSON.stringify(buildCheckoutPayload(data, items, '', locale));
      const payload = buildCheckoutPayload(data, items, getIdempotencyKey(fingerprint), locale);
      const response = await submitCheckout(payload);

      if (response.mode === 'submitted') {
        completeOrder('submitted', response.orderNumber);
        return;
      }

      const result = await confirmPayment(response.clientSecret, {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone || undefined,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      completeOrder('payment', response.orderNumber);
    } catch (error) {
      setSubmitError(submitErrorMessage(error instanceof CheckoutApiError ? error.code : 'serverError'));
    }
  };

  const firstError =
    translateError(
      errors.firstName?.message ||
      errors.lastName?.message ||
      errors.email?.message ||
      errors.phone?.message ||
      errors.companyName?.message ||
      errors.billingAddress?.message ||
      errors.additionalInfo?.message ||
      errors.shippingAddress?.message,
    ) ||
    cardError ||
    submitError;

  if (!hasHydrated) return <div className={styles.mainContainer} />;

  // Panier vide ou à corriger (accès direct par l'URL) : retour au panier plutôt qu'un formulaire voué à l'échec.
  // Pas après une commande réussie : le panier vient d'être vidé, c'est la confirmation qui doit s'afficher.
  if (!confirmation && (items.length === 0 || isBlocked)) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.container}>
          <p className={styles.error} role="alert">
            {items.length === 0 ? tCart('heroEmptyCart') : tCart('removeUnavailableFirst')}
          </p>
          <LocalLink href="/cart" className={styles.confirmationLink}>
            {t('backToCart')}
          </LocalLink>
        </div>
      </div>
    );
  }

  // Inscription Google pas terminée : ni facturation ni ramassage, le profil doit être complété avant de commander
  if (!confirmation && session?.user?.needsPickupInfo) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.container}>
          <p className={styles.error} role="alert">
            {t('completeProfileFirst')}
          </p>
          <LocalLink href="/complete-profile" className={styles.confirmationLink}>
            {t('completeProfileLink')}
          </LocalLink>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      {!confirmation && (
      <div className={styles.container}>
        
        <div className={styles.items}>
          <h3>{t('cartSummary')}</h3>
          {items.map((item) =>
            item.kind === 'product' ? (
              <div key={item.id} className={styles.item}>
                <span>{locale === 'en' ? item.nameEn || item.nameFr : item.nameFr}</span>
                <span>×{item.quantity}</span>
                {/* Prix actuel du catalogue, comme au paiement */}
                <span>{formatCents((getProductBySlug(item.productId)?.price ?? 0) * item.quantity, locale)}</span>
              </div>
            ) : (
              <div key={item.id} className={styles.item}>
                <span>{tCart(`requestType.${item.requestType}`)}</span>
                {/* Un délai par adresse : chaque délai différent n'est affiché qu'une fois */}
                <span>{[...new Set(item.addresses.map((a) => delayText(a.schedule)))].join(' · ')}</span>
                <span>{tCart('priceOnQuote')}</span>
              </div>
            ),
          )}

          {/* Montant à payer, taxes incluses : visible avant de cliquer sur « Payer » */}
          {hasProducts && (
            <div className={`${styles.item} ${styles.totalRow}`}>
              <span>{tCart('total')}</span>
              <span>{formatCents(estimate.total, locale)}</span>
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.section}>
            <h3>{t('paymentData')}</h3>

            <div className={styles.name}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">{t('firstname')}</label>
                <input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName) || undefined}
                  {...register('firstName')}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName">{t('lastname')}</label>
                <input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName) || undefined}
                  {...register('lastName')}
                />
              </div>
            </div>

            <div className={styles.name}>
              <div className={styles.formGroup}>
                <label htmlFor="email">{t('email')}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email) || undefined}
                  {...register('email')}
                  readOnly={isAuthenticated}
                />
              </div>

              {!isAuthenticated && (
                <div className={styles.formGroup}>
                  <label htmlFor="phone">{t('phone')}</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={14}
                    placeholder="(514) 825-2709"
                    aria-invalid={Boolean(errors.phone) || undefined}
                    {...register('phone')}
                    onInput={(e) => {
                      // Même format que le formulaire de contact : (438) 722-3922
                      e.currentTarget.value = formatPhone(e.currentTarget.value);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Invités : facturation, chaque champ sur toute la largeur (membres : celle du compte) */}
            {!isAuthenticated && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="companyName">{t('companyName')}</label>
                  <input
                    id="companyName"
                    autoComplete="organization"
                    maxLength={GUEST_INFO_LIMITS.companyName}
                    {...register('companyName')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="billingAddress">{t('billingAddress')}</label>
                  <Controller
                    name="billingAddress"
                    control={control}
                    render={({ field }) => (
                      <AddressAutocomplete
                        id="billingAddress"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        aria-invalid={Boolean(errors.billingAddress) || undefined}
                      />
                    )}
                  />
                </div>
              </>
            )}

            {/* Tous : informations supplémentaires pour la facturation */}
            <div className={styles.formGroup}>
              <label htmlFor="additionalInfo">{t('additionalInfo')}</label>
              <textarea
                id="additionalInfo"
                rows={4}
                maxLength={GUEST_INFO_LIMITS.additionalInfo}
                {...register('additionalInfo')}
              />
            </div>
          </div>

          {requiresPayment && (
            <div className={styles.section}>
              <CardFields
                onFieldChange={handleCardChange}
                labels={{ cardNumber: t('cardNumber'), expiry: t('expiry'), cvc: t('cvc') }}
                groupClassName={styles.formGroup}
              />
            </div>
          )}

          {hasProducts && (
            <div className={styles.section}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input className={styles.radioInput} type="radio" value="pickup" {...deliveryModeField} />
                  <div className={`${styles.radioButton} ${styles.radioButtonLeft}`}>{t('pickup')}</div>
                </label>

                <label className={styles.radioLabel}>
                  <input className={styles.radioInput} type="radio" value="delivery" {...deliveryModeField} />
                  <div className={`${styles.radioButton} ${styles.radioButtonRight}`}>{t('delivery')}</div>
                </label>
              </div>

              {deliveryMode === 'pickup' && (
                <div className={styles.formGroup}>
                  <p className={styles.infoTitle}>{t('pickupAddress')}</p>
                  <p>{t('pickupInfo')}</p>
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
                        onChange={(text: string) => {
                          setAddressText(text);
                          // Le texte ne correspond plus à la suggestion choisie : il faut en choisir une nouvelle
                          field.onChange(null);
                        }}
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
                        aria-invalid={Boolean(errors.shippingAddress) || undefined}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          )}

          <div className={styles.section}>
            {firstError && (
              <div className={styles.error} role="alert">
                {firstError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('sending') : requiresPayment ? t('makePay') : t('submitOrder')}
            </button>
          </div>
        </form>
      </div>
      )}

      {confirmation && (
      <div className={styles.confirmation}>
        <div className={styles.completedPayment} role="status">
          <div>
            <FaRegCheckCircle aria-hidden="true" />
          </div>
          <p>
            {t.rich('confirmation.orderNumber', {
              number: confirmation.orderNumber,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
            <br />
            {confirmation.mode === 'payment' ? t('confirmation.paymentReceived') : t('confirmation.orderSent')}
            <br />
            {isAuthenticated ? t('confirmation.trackInDashboard') : t('confirmation.contactByEmail')}
          </p>
        </div>

        <LocalLink href={isAuthenticated ? '/dashboard' : '/shop'} className={styles.confirmationLink}>
          {isAuthenticated ? t('viewOrders') : t('backToShop')}
        </LocalLink>
      </div>
      )}
    </div>
  );
}