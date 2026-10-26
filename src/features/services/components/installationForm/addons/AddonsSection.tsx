'use client';

import { useId } from 'react';
import { Controller, useFormState, useWatch } from 'react-hook-form';
import { ADDON_LABELS, ADDONS, MAX_ADDONS, TEXT_LIMITS, type Addon } from '@/features/services/constants/installation';
import { createAddonEntry } from '@/features/services/schemas/installation.schema';
import { CheckboxGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

const ADDON_OPTIONS = toOptions(ADDONS, ADDON_LABELS);

export function AddonsSection() {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();
  
  const addons = useWatch({ control, name: 'addons' });

  const { errors } = useFormState({ control, name: 'addons' });

  const otherIndex = addons.findIndex((a) => a.addon === 'other');

  // Les entrées existantes sont conservées : seules les nouvelles sont créées
  const handleChange = (next: Addon[]) => {
    const current = getValues('addons');
    update('addons', next.map((key) => current.find((e) => e.addon === key) ?? createAddonEntry(key)));
  };

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails des ajouts</h3>

      <CheckboxGroup
        legend="Veuillez choisir les ajouts nécessaires"
        options={ADDON_OPTIONS}
        value={addons.map((a) => a.addon)}
        onChange={handleChange}
        max={MAX_ADDONS}
        columns={4}
        hint={`Maximum ${MAX_ADDONS} ajouts`}
        error={errors.addons?.root?.message ?? errors.addons?.message}
        required
      />

      {otherIndex !== -1 && (
        <Controller
          key={otherIndex} // remonte si l'entrée « Autres » change de position
          control={control}
          name={`addons.${otherIndex}.mention`}
          render={(props) => (
            <TextField
              {...bindField(props)}
              label="Veuillez indiquer la mention qui doit être affichée"
              maxLength={TEXT_LIMITS.addonMention}
              multiline
              rows={2}
              required
            />
          )}
        />
      )}
    </section>
  );
}