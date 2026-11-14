'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { KEYBOX_CODE_MAX_DIGITS } from '@/features/services/constants/installation';
import { MAX_REMOVAL_KEYBOXES, REMOVAL_TEXT_LIMITS } from '@/features/services/constants/removal';
import { QuantityField, TextField } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from '../../formContext';

import { FaUnlock } from "react-icons/fa";

import styles from '../../../installationForm/installationForm.module.css';

export function KeyboxSection() {
    const headingId = useId(); 
    const { control } = useRemovalFormContext();
    const t = useTranslations('services');

    return (
        <section aria-labelledby={headingId} className={styles.material}>
            <h3 id={headingId} className={styles.title}><FaUnlock size={24} /> {t('removal.keyboxTitle')}</h3>
            <Controller
            control={control}
            name="keybox.quantity"
            render={({ field, fieldState }) => (
                <QuantityField
                label={t('removal.keyboxQuantity')}
                value={field.value}
                onChange={field.onChange}
                min={1}
                max={MAX_REMOVAL_KEYBOXES}
                hint={t('common.max', { max: MAX_REMOVAL_KEYBOXES })}
                error={fieldState.error?.message}
                />
            )}
            />
            <Controller
            control={control}
            name="keybox.code"
            render={(props) => (
                <TextField
                {...bindRemovalField(props)}
                // Chiffres seulement, longueur maximale imposée à la saisie
                onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
                label={t('removal.keyboxCode')}
                placeholder={t('installation.codePlaceholder')}
                inputMode="numeric"
                hint={t('installation.codeHint', { max: KEYBOX_CODE_MAX_DIGITS })}
                required
                />
            )}
            />
            <Controller
            control={control}
            name="keybox.placement"
            render={(props) => (
                <TextField
                {...bindRemovalField(props)}
                label={t('installation.keyboxPlacement')}
                maxLength={REMOVAL_TEXT_LIMITS.keyboxPlacement}
                multiline
                rows={2}
                />
            )}
            />
        </section>
    );
}