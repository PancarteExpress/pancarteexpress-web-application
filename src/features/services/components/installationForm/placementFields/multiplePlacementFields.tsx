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

type OwnPlacementsName = `addons.${number}.placements` | 'openHouse.placements';

/** Emplacements à sous-options (accès, fixation, côté, description) */
const WITH_SUB_OPTIONS: ReadonlySet<Location> = new Set(['wall', 'window', 'balcony', 'other']);

interface MultiplePlacementFieldsProps {
  name: OwnPlacementsName;
  /** Nombre d'unités : autant d'emplacements au maximum */
  quantity: number;
  /** Nom de l'ajout (ex. « À vendre », « Visite libre ») */
  label: string;
  /** Question et aide propres (ex. emplacement des pancartes déjà sur place) */
  legend?: string;
  hint?: string;
}

/**
 * De 1 à `quantity` emplacements distincts. Un seul : toutes les unités vont au même endroit ;
 * moins que d'unités : l'équipe les répartit.
 */
export function MultiplePlacementFields({ name, quantity, label, legend, hint }: MultiplePlacementFieldsProps) {
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
    // Un seul emplacement possible : le nouveau choix remplace l'ancien
    const chosen = quantity === 1 && next.length > 1 ? next.filter((l) => !locations.includes(l)) : next;
    // Garde les sous-options des emplacements conservés, dans l'ordre de la liste
    update(
      name,
      LOCATIONS.filter((l) => chosen.includes(l)).map(
        (l) => placements.find((p) => p.location === l) ?? { ...createEmptyPlacement(), location: l },
      ),
    );
  };

  return (
    <div className={styles.ownPlacements}>
      <CheckboxGroup
        legend={legend ?? t('installation.ownPlacementsLegend', { count: quantity, label })}
        options={toOptions(LOCATIONS, (l) => t(`locations.${l}`))}
        value={locations}
        onChange={handleLocations}
        // À 1, pas de limite : un clic remplace le choix (voir handleLocations)
        max={quantity > 1 ? quantity : undefined}
        hint={quantity > 1 ? hint ?? t('installation.ownPlacementsHint') : undefined}
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
