'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { TEXT_LIMITS } from '@/features/services/constants/installation';
import { TextField } from '@/features/services/components/fields';
import { bindField, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';
import { HiQuestionMarkCircle } from "react-icons/hi";

export function OtherSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const t = useTranslations('services.installation');

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><HiQuestionMarkCircle size={34} /> {t('otherTitle')}</h3>

      <Controller
        control={control}
        name="otherNeeds"
        render={(props) => (
          <fieldset className={styles.unit}>
            <TextField
              {...bindField(props)}
              label={t('otherNeeds')}
              maxLength={TEXT_LIMITS.otherNeeds}
              multiline
              rows={4}
              required
            />
          </fieldset>
        )}
      />
    </section>
  );
}