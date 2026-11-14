'use client';

import { useId } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ADDONS, MAX_ADDONS, type Addon } from '@/features/services/constants/installation';
import { createAddonEntry } from '@/features/services/schemas/installation.schema';
import { CheckboxGroup, toOptions } from '@/features/services/components/fields';
import { useFormUpdater, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';

import { SiOneplus } from "react-icons/si";

export function AddonsSection() {
  const headingId = useId();
  const t = useTranslations('services');
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();
  
  const addons = useWatch({ control, name: 'addons' });

  const { errors } = useFormState({ control, name: 'addons' });

  // Les entrées existantes sont conservées : seules les nouvelles sont créées
  const handleChange = (next: Addon[]) => {
    const current = getValues('addons');
    update('addons', next.map((key) => current.find((e) => e.addon === key) ?? createAddonEntry(key)));
  };

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><SiOneplus  size={34} /> {t('installation.addonsTitle')}</h3>

      <CheckboxGroup
        legend={t('installation.addonsLegend')}
        options={toOptions(ADDONS, (a) => t(`addons.${a}`))}
        value={addons.map((a) => a.addon)}
        onChange={handleChange}
        max={MAX_ADDONS}
        columns={4}
        hint={t('installation.addonsMax', { max: MAX_ADDONS })}
        error={errors.addons?.root?.message ?? errors.addons?.message}
        required
      />
    </section>
  );
}