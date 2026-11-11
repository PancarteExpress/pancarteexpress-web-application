'use client';

import { get, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { LOCATIONS } from '@/features/services/constants/installation';
import { createEmptyPlacement, type PlacementFormValues } from '@/features/services/schemas/placement.schema';
import { CheckboxGroup, Notice, toOptions } from '@/features/services/components/fields';
import { PlacementPicker, toPlacementErrors } from '@/features/services/components/placement/PlacementPicker';
import { useFormUpdater, useInstallationFormContext } from './formContext';
import styles from './installationForm.module.css';

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

/* ==========================================================================
   Emplacements d'un ajout ou de la visite libre, sans pancarte commandée
   ========================================================================== */

type OwnPlacementsName = `addons.${number}.placements` | 'openHouse.placements';

/** Emplacements à sous-options (accès, fixation, côté, description) */
const WITH_SUB_OPTIONS: ReadonlySet<Location> = new Set(['wall', 'window', 'balcony', 'other']);

interface OwnPlacementsFieldProps {
  name: OwnPlacementsName;
  /** Nombre d'unités : autant d'emplacements au maximum */
  quantity: number;
  /** Nom de l'ajout (ex. « À vendre », « Visite libre ») */
  label: string;
}

/**
 * De 1 à `quantity` emplacements distincts. Un seul : toutes les unités vont au même endroit ;
 * moins que d'unités : l'équipe les répartit.
 */
export function OwnPlacementsField({ name, quantity, label }: OwnPlacementsFieldProps) {
  const t = useTranslations('services');
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const placements: PlacementFormValues[] = useWatch({ control, name });
  const { errors } = useFormState({ control, name });
  // Erreur de la liste (aucun, trop, doublon) et erreurs de chaque emplacement
  const listErrors: ({ message?: string; root?: { message?: string } } & Record<number, PlacementFieldErrors>) | undefined =
    get(errors, name);

  const locations = placements.flatMap((p) => (p.location ? [p.location] : []));

  const handleLocations = (next: Location[]) => {
    // Garde les sous-options des emplacements conservés, dans l'ordre de la liste
    update(
      name,
      LOCATIONS.filter((l) => next.includes(l)).map(
        (l) => placements.find((p) => p.location === l) ?? { ...createEmptyPlacement(), location: l },
      ),
    );
  };

  return (
    <div className={styles.ownPlacements}>
      <CheckboxGroup
        legend={t('installation.ownPlacementsLegend', { count: quantity, label })}
        options={toOptions(LOCATIONS, (l) => t(`locations.${l}`))}
        value={locations}
        onChange={handleLocations}
        max={quantity}
        hint={quantity > 1 ? t('installation.ownPlacementsHint') : undefined}
        error={listErrors?.message ?? listErrors?.root?.message}
        required
      />

      {locations.length > 1 && locations.length < quantity && (
        <Notice>{t('installation.placementsSpread', { count: quantity, places: locations.length })}</Notice>
      )}

      {placements.map((placement, i) =>
        placement.location && WITH_SUB_OPTIONS.has(placement.location) ? (
          <div key={placement.location} className={styles.ownPlacement}>
            <p className={styles.unitTitle}>{t(`locations.${placement.location}`)}</p>
            <PlacementPicker
              hideLocation
              legend={t(`locations.${placement.location}`)}
              value={placement}
              onChange={(next) => update(name, placements.map((p, j) => (j === i ? next : p)))}
              errors={toPlacementErrors(listErrors?.[i])}
            />
          </div>
        ) : null,
      )}
    </div>
  );
}
