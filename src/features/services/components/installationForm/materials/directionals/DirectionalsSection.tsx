'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_DIRECTIONALS, SIGN_MENTIONS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../../formContext';
import { PlacedUnitsFields } from './PlacedUnitsFields';
import styles from '../../installationForm.module.css';

import { BiSolidDirections } from "react-icons/bi";

/** isMember : les invités saisissent la mention plutôt que de la choisir */
export function DirectionalsSection({ isMember }: { isMember: boolean }) {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const t = useTranslations('services');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      
      <h3 id={headingId} className={styles.title}><BiSolidDirections size={34} /> {t('installation.directionalsTitle')}</h3>

      {isMember ? (
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
      ) : (
        <Controller
          control={control}
          name="directionals.customMention"
          render={(props) => (
            <TextField
              {...bindField(props)}
              // Absente des anciens brouillons
              value={props.field.value ?? ''}
              label={t('installation.guestDirectionalMentionLegend')}
              maxLength={TEXT_LIMITS.directionalMention}
              multiline
              rows={2}
              required
            />
          )}
        />
      )}

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