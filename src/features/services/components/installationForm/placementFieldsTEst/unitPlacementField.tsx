'use client';

import { get, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { LOCATIONS } from '@/features/services/constants/installation';
import { createEmptyPlacement, type PlacementFormValues } from '@/features/services/schemas/placement.schema';
import { CheckboxGroup, Notice, toOptions } from '@/features/services/components/fields';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

type Location = (typeof LOCATIONS)[number];
type PlacementFieldErrors = Parameters<typeof toPlacementErrors>[0];

/* ==========================================================================
   Emplacement d'une unité (pancarte, kit)
   ========================================================================== */

type UnitPlacementName = `frames.units.${number}.placement` | `kits.units.${number}.placement`;

/** Emplacement propre à une pancarte ou à un kit, en dernier dans ses détails */
export function UnitPlacementField({ name }: { name: UnitPlacementName }) {
  const t = useTranslations('services.installation');
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const value = useWatch({ control, name });
  const { errors } = useFormState({ control, name });
  const fieldErrors: PlacementFieldErrors = get(errors, name);

  return (
    <PlacementPicker
      legend={t('unitPlacementLegend')}
      value={value}
      onChange={(next) => update(name, next)}
      errors={toPlacementErrors(fieldErrors)}
    />
  );
}