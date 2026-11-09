'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_DIRECTIONALS, SIGN_MENTIONS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { RadioGroup, toOptions } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../formContext';
import { PlacedUnitsFields } from '../PlacedUnitsFields';
import styles from '../installationForm.module.css';

export function DirectionalsSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const t = useTranslations('services');

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{t('installation.directionalsTitle')}</h3>

      <Controller
        control={control}
        name="directionals.mention"
        render={(props) => (
          <RadioGroup
            {...bindField(props)}
            legend={t('installation.directionalMentionLegend')}
            options={toOptions(SIGN_MENTIONS, (m) => t(`mentions.${m}`))}
            required
          />
        )}
      />

      <PlacedUnitsFields
        name="directionals.units"
        quantityLabel={t('installation.directionalsQuantity')}
        unitLabel={(i) => t('installation.directionalPlacement', { number: i + 1 })}
        placeholder={t('installation.placementExample')}
        max={MAX_DIRECTIONALS}
        maxLength={TEXT_LIMITS.directionalPlacement}
      />
    </section>
  );
}