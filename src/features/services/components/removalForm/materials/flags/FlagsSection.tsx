'use client';

import { useId, } from 'react';
import { Controller, } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FLAG_MENTIONS, TEXT_LIMITS, } from '@/features/services/constants/installation';
import { MAX_REMOVAL_FLAGS, REMOVAL_TEXT_LIMITS, } from '@/features/services/constants/removal';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from '../../formContext';

import { FaUnlock } from "react-icons/fa";

import styles from '../../../installationForm/installationForm.module.css';

export function FlagsSection() {
    const headingId = useId();
    const { control, setValue, formState } = useRemovalFormContext();
    const t = useTranslations('services');

    return (
        <section aria-labelledby={headingId} className={styles.material}>
            <h3 id={headingId} className={styles.title}><FaUnlock size={24} /> {t('removal.flagsTitle')}</h3>
            
            <Controller
            control={control}
            name="flags.mention"
            render={(props) => (
                <>
                <RadioGroup
                    {...bindRemovalField(props)}
                    onChange={(value) => {
                    props.field.onChange(value);
                    if (value !== 'other') {
                        setValue('flags.customMention', '', { shouldDirty: true, shouldValidate: formState.isSubmitted });
                    }
                    }}
                    legend={t('installation.flagMentionLegend')}
                    options={toOptions(FLAG_MENTIONS, (m) => t(`mentions.${m}`))}
                    required
                />
                {props.field.value === 'other' && (
                    <Controller
                    control={control}
                    name="flags.customMention"
                    render={(p) => (
                        <fieldset className={styles.unit}>
                            <TextField
                            {...bindRemovalField(p)}
                            label={t('installation.flagCustomMention')}
                            maxLength={TEXT_LIMITS.flagMention}
                            required
                            />
                        </fieldset>
                    )}
                    />
                )}
                </>
            )}
            />
            <Controller
            control={control}
            name="flags.quantity"
            render={({ field, fieldState }) => (
                <QuantityField
                label={t('removal.flagsQuantity')}
                value={field.value}
                onChange={field.onChange}
                min={1}
                max={MAX_REMOVAL_FLAGS}
                hint={t('common.max', { max: MAX_REMOVAL_FLAGS })}
                error={fieldState.error?.message}
                />
            )}
            />
            <Controller
            control={control}
            name="flags.placement"
            render={(props) => (
                <fieldset className={styles.unit}>
                    <TextField
                    {...bindRemovalField(props)}
                    label={t('removal.flagsPlacement')}
                    maxLength={REMOVAL_TEXT_LIMITS.flagsPlacement}
                    multiline
                    rows={2}
                    />
                </fieldset>
            )}
            />
        </section>
    );
}