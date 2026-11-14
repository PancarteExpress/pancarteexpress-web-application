'use client';

import { useId } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { SIGN_MENTIONS, } from '@/features/services/constants/installation';
import { MAX_REMOVAL_DIRECTIONALS, REMOVAL_TEXT_LIMITS, } from '@/features/services/constants/removal';
import { createRemovalDirectional } from '@/features/services/schemas/removal.schema';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from '../../formContext';

import { BiSolidDirections } from "react-icons/bi";

import styles from '../../../installationForm/installationForm.module.css';

export function DirectionalsSection() {
    const headingId = useId();
    const { control } = useRemovalFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: 'directionals.units' });
    const t = useTranslations('services');

    const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
        append(Array.from({ length: next - current }, createRemovalDirectional), { shouldFocus: false });
    } else {
        remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
    };

    return (

    <section aria-labelledby={headingId} className={styles.material}>
        <h3 id={headingId} className={styles.title}><BiSolidDirections size={34} /> {t('removal.directionalsTitle')}</h3>
        <Controller
        control={control}
        name="directionals.mention"
        render={(props) => (
            <RadioGroup
            {...bindRemovalField(props)}
            legend={t('installation.directionalMentionLegend')}
            options={toOptions(SIGN_MENTIONS, (m) => t(`mentions.${m}`))}
            required
            />
        )}
        />
        <QuantityField
        label={t('removal.directionalsQuantity')}
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_REMOVAL_DIRECTIONALS}
        hint={t('common.max', { max: MAX_REMOVAL_DIRECTIONALS })}
        />
        {fields.map((field, index) => (
        <Controller
            key={field.id}
            control={control}
            name={`directionals.units.${index}.placement`}
            render={(props) => (
            <fieldset className={styles.unit}>
                <TextField
                    {...bindRemovalField(props)}
                    label={t('installation.directionalPlacement', { number: index + 1 })}
                    placeholder={t('installation.placementExample')}
                    maxLength={REMOVAL_TEXT_LIMITS.directionalPlacement}
                    multiline
                    rows={2}
                />
            </fieldset>
            )}
        />
        ))}
    </section>
    );
}