'use client';

import { useTranslations } from 'next-intl';
import { LARGE_ACCESS, LARGE_LOCATIONS, type LargeAccess, type LargeLocation } from '@/features/services/constants/largeFormat';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { toOptions } from '@/features/services/components/fields/types';
import styles from './largeFormatForms.module.css';

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
  const t = useTranslations('services');
  return (
    <>
      <RadioGroup
        legend={legend}
        options={toOptions(LARGE_LOCATIONS, (l) => t(`largeFormat.locations.${l}`))}
        value={location}
        onChange={onLocationChange}
        columns={2}
        error={errors.location}
        required
      />
      {location === 'wall' && (
        <div className={styles.subOptions}>
          <RadioGroup
            legend={t('placement.access')}
            options={toOptions(LARGE_ACCESS, (a) => t(`access.${a}`))}
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
