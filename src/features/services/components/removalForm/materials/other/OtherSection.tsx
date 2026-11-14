'use client';

import { useId, } from 'react';
import { Controller, } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { REMOVAL_TEXT_LIMITS, } from '@/features/services/constants/removal';
import { TextField } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from '../../formContext';

import { HiQuestionMarkCircle } from "react-icons/hi";

import styles from '../../../installationForm/installationForm.module.css';

export function OtherSection() {
    const headingId = useId();
    const { control } = useRemovalFormContext();
    const t = useTranslations('services');

    return (
    <section aria-labelledby={headingId} className={styles.material}>
        <h3 id={headingId} className={styles.title}><HiQuestionMarkCircle size={34} /> {t('removal.otherTitle')}</h3>
        <Controller
        control={control}
        name="otherDetails"
        render={(props) => (
            <fieldset className={styles.unit}>
                <TextField
                {...bindRemovalField(props)}
                label={t('removal.otherDetails')}
                maxLength={REMOVAL_TEXT_LIMITS.otherDetails}
                multiline
                rows={3}
                required
                />
            </fieldset>
        )}
        />
    </section>
    );
}