'use client';

import {
  LARGE_ACCESS, LARGE_ACCESS_LABELS, LARGE_LOCATION_LABELS, LARGE_LOCATIONS,
  type LargeAccess, type LargeLocation,
} from '@/features/services/constants/largeFormat';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { toOptions } from '@/features/services/components/fields/types';
import styles from './largeFormatForms.module.css';

const LOCATION_OPTIONS = toOptions(LARGE_LOCATIONS, LARGE_LOCATION_LABELS);
const ACCESS_OPTIONS = toOptions(LARGE_ACCESS, LARGE_ACCESS_LABELS);

interface LargePlacementPickerProps {
  legend: string;
  location: LargeLocation | null;
  access: LargeAccess | null;
  /** Changer d'emplacement remet l'accès à zéro : c'est au parent de le faire */
  onLocationChange: (location: LargeLocation) => void;
  onAccessChange: (access: LargeAccess) => void;
  errors?: { location?: string; access?: string };
}

/** Au sol / Au mur, puis l'accès si Au mur (installation et récupération grand format) */
export function LargePlacementPicker({
  legend, location, access, onLocationChange, onAccessChange, errors = {},
}: LargePlacementPickerProps) {
  return (
    <>
      <RadioGroup
        legend={legend}
        options={LOCATION_OPTIONS}
        value={location}
        onChange={onLocationChange}
        columns={2}
        error={errors.location}
        required
      />
      {location === 'wall' && (
        <div className={styles.subOptions}>
          <RadioGroup
            legend="Accès"
            options={ACCESS_OPTIONS}
            value={access}
            onChange={onAccessChange}
            columns={2}
            error={errors.access}
            required
          />
        </div>
      )}
    </>
  );
}
