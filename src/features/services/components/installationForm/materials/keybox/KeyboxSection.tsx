'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { KEYBOX_CODE_MAX_DIGITS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';
import { FaUnlock } from "react-icons/fa";

export function KeyboxSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const t = useTranslations('services.installation');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><FaUnlock size={24} /> {t('keyboxTitle')}</h3>

      <Controller
        control={control}
        name="keybox.code"
        render={(props) => (
          <fieldset className={styles.unit}>
            <TextField
              {...bindField(props)}
              // Chiffres seulement, longueur maximale imposée à la saisie
              onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
              label={t('keyboxCode')}
              placeholder={t('codePlaceholder')}
              inputMode="numeric"
              hint={t('codeHint', { max: KEYBOX_CODE_MAX_DIGITS })}
              required
            />
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="keybox.placement"
        render={(props) => (
          <fieldset className={styles.unit}>
            <TextField
              {...bindField(props)}
              label={t('keyboxPlacement')}
              maxLength={TEXT_LIMITS.keyboxPlacement}
              multiline
              rows={2}
            />
          </fieldset>
        )}
      />
    </section>
  );
}