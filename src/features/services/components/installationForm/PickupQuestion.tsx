'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import { Notice, YesNoField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from './formContext';
import styles from './installationForm.module.css';

/**
 * Invités : aller chercher le matériel à installer (pancartes, ancrages, poteaux) à une autre adresse ?
 * Posée une seule fois, juste sous les services, au-dessus des détails de l'installation.
 */
export function PickupQuestion() {
  const addressId = useId();
  const t = useTranslations('services');
  const translateError = useIssueMessage('services.errors');
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();

  return (
    <div className={styles.pickupQuestion}>
    <Controller
      control={control}
      name="pickup"
      render={(props) => (
        <>
          <YesNoField
            {...bindField(props)}
            onChange={(value) => {
              props.field.onChange(value);
              if (!value) update('pickupAddress', '');
            }}
            legend={t('installation.pickupLegend')}
            required
          />

          {props.field.value === true && (
            <Controller
              control={control}
              name="pickupAddress"
              render={({ field, fieldState }) => {
                const errorId = `${addressId}-error`;
                return (
                <div className={styles.pickup}>
                  <Notice>{t('installation.pickupFee')}</Notice>
                  <label htmlFor={addressId} className={styles.label}>
                    {t('installation.pickupAddress')} <span aria-hidden="true" className={styles.required}>*</span>
                  </label>
                  <AddressAutocomplete 
                    id={addressId} 
                    value={field.value} 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref} 
                    aria-invalid={Boolean(fieldState.error) || undefined}
                    aria-describedby={fieldState.error ? errorId : undefined}
                  />
                  {fieldState.error && <p id={errorId} className={styles.error}>{translateError(fieldState.error.message)}</p>}
                </div>
                );
              }}
            />
          )}
        </>
      )}
    />
    </div>
  );
}
