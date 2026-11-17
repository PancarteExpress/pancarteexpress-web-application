'use client';

import { useId } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import { AFTER_REMOVAL_CHOICES, REMOVAL_TEXT_LIMITS } from '@/features/services/constants/removal';
import { Notice, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext, useRemovalUpdater } from './formContext';
import styles from '../installationForm/installationForm.module.css';

/**
 * Invités : que doit-on faire avec le matériel retiré ?
 * Posée une seule fois, juste sous les services, au-dessus des détails du retrait.
 */
export function AfterRemovalQuestion() {
  const addressId = useId();
  const t = useTranslations('services.removal.afterRemoval');
  const translateError = useIssueMessage('services.errors');
  const { control } = useRemovalFormContext();
  const update = useRemovalUpdater();
  const choice = useWatch({ control, name: 'afterRemoval' });

  return (
    <div className={styles.pickupQuestion}>
      <Controller
        control={control}
        name="afterRemoval"
        render={(props) => (
          <RadioGroup
            {...bindRemovalField(props)}
            onChange={(value) => {
              props.field.onChange(value);
              // Chaque choix n'a que ses propres champs
              if (value !== 'deliver') update('deliveryAddress', '');
              if (value === 'storage') update('dropOff', '');
            }}
            legend={t('legend')}
            options={toOptions(AFTER_REMOVAL_CHOICES, (c) => t(`choices.${c}`))}
            required
          />
        )}
      />

      {choice === 'deliver' && (
        <Controller
          control={control}
          name="deliveryAddress"
          render={({ field, fieldState }) => {
            const errorId = `${addressId}-error`;
            return (
              <div className={styles.pickup}>
                <p className={styles.label}>{t('deliveryTitle')}</p>
                <Notice>{t('deliveryFee')}</Notice>
                <label htmlFor={addressId} className={styles.label}>
                  {t('deliveryAddress')} <span aria-hidden="true" className={styles.required}>*</span>
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

      {(choice === 'deliver' || choice === 'leaveOnSite') && (
        <Controller
          control={control}
          name="dropOff"
          render={(props) => (
            <TextField
              {...bindRemovalField(props)}
              label={t('dropOff')}
              placeholder={t('dropOffPlaceholder')}
              maxLength={REMOVAL_TEXT_LIMITS.dropOff}
              multiline
              rows={4}
            />
          )}
        />
      )}

      {choice === 'storage' && <Notice>{t('storageMessage')}</Notice>}
    </div>
  );
}
