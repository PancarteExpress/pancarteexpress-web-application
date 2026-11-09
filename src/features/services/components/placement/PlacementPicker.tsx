'use client';

import { useTranslations } from 'next-intl';
import {
  ACCESS_CHOICES, LADDERS, LOCATIONS, MOUNTINGS, TEXT_LIMITS, WINDOW_SIDES, type AccessChoice,
} from '@/features/services/constants/installation';
import { createEmptyPlacement, type PlacementFormValues } from '@/features/services/schemas/placement.schema';
import { RadioGroup, TextField, toOptions, type ChoiceOption } from '@/features/services/components/fields';
import styles from './PlacementPicker.module.css';

export type PlacementErrors = Partial<Record<keyof PlacementFormValues, string>>;

/** Convertit les erreurs RHF d'un sous-objet « placement » en messages simples. */
export function toPlacementErrors(
  e: { [K in keyof PlacementFormValues]?: { message?: string } } | undefined,
): PlacementErrors {
  if (!e) return {};
  return {
    location: e.location?.message,
    access: e.access?.message,
    mounting: e.mounting?.message,
    windowSide: e.windowSide?.message,
    contact: e.contact?.message,
    keyboxInfo: e.keyboxInfo?.message,
    description: e.description?.message,
  };
}

interface PlacementPickerProps {
  legend: string;
  value: PlacementFormValues;
  onChange: (value: PlacementFormValues) => void;
  errors?: PlacementErrors;
}

export function PlacementPicker({ legend, value, onChange, errors = {} }: PlacementPickerProps) {
  const t = useTranslations('services');
  const accessLabel = (a: AccessChoice) => t(`access.${a}`);
  // Mur : échelles seulement
  const wallAccessOptions: ChoiceOption<AccessChoice>[] = toOptions(LADDERS, accessLabel);
  const set = <K extends keyof PlacementFormValues>(key: K, v: PlacementFormValues[K]) =>
    onChange({ ...value, [key]: v });

  const handleAccessChange = (access: AccessChoice) => {
    onChange({
      ...value,
      access,
      // Les champs liés à un autre choix d'accès sont vidés
      contact: access === 'phoneAppointment' ? value.contact : '',
      keyboxInfo: access === 'keybox' ? value.keyboxInfo : '',
    });
  };

  const { location } = value;

  return (
    <>
      <RadioGroup
        legend={legend}
        options={toOptions(LOCATIONS, (l) => t(`locations.${l}`))}
        value={location}
        // Nouvel emplacement : toutes les sous-options repartent de zéro
        onChange={(next) => onChange({ ...createEmptyPlacement(), location: next })}
        error={errors.location}
        required
      />

      {location === 'wall' && (
        <div className={styles.subOptions}>
          <RadioGroup
            legend={t('placement.access')}
            options={wallAccessOptions}
            value={value.access}
            onChange={(v) => set('access', v)}
            error={errors.access}
            required
          />
          <RadioGroup
            legend={t('placement.mounting')}
            options={toOptions(MOUNTINGS, (m) => t(`mountings.${m}`))}
            value={value.mounting}
            onChange={(v) => set('mounting', v)}
            columns={2}
            error={errors.mounting}
            required
          />
        </div>
      )}

      {(location === 'window' || location === 'balcony') && (
        <div className={styles.subOptions}>
          <RadioGroup
            legend={t('placement.access')}
            options={toOptions(ACCESS_CHOICES, accessLabel)}
            value={value.access}
            onChange={handleAccessChange}
            error={errors.access}
            required
          />
          {value.access === 'phoneAppointment' && (
            <TextField
              label={t('placement.contact')}
              value={value.contact}
              onChange={(v) => set('contact', v)}
              maxLength={TEXT_LIMITS.appointmentContact}
              multiline
              error={errors.contact}
              required
            />
          )}
          {value.access === 'keybox' && (
            <TextField
              label={t('placement.keyboxInfo')}
              placeholder={t('placement.keyboxInfoPlaceholder')}
              value={value.keyboxInfo}
              onChange={(v) => set('keyboxInfo', v)}
              maxLength={TEXT_LIMITS.keyboxAccess}
              error={errors.keyboxInfo}
              required
            />
          )}
          {location === 'window' && (
            <RadioGroup
              legend={t('placement.windowSide')}
              options={toOptions(WINDOW_SIDES, (s) => t(`windowSides.${s}`))}
              value={value.windowSide}
              onChange={(v) => set('windowSide', v)}
              columns={2}
              error={errors.windowSide}
              required
            />
          )}
        </div>
      )}

      {location === 'other' && (
        <div className={styles.subOptions}>
          <TextField
            label={t('placement.description')}
            value={value.description}
            onChange={(v) => set('description', v)}
            maxLength={TEXT_LIMITS.placementDescription}
            multiline
            error={errors.description}
            required
          />
        </div>
      )}
    </>
  );
}