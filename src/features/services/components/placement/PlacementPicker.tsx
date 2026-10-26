'use client';

import {
  ACCESS_CHOICES, ACCESS_LABELS, LADDER_LABELS, LADDERS, LOCATION_LABELS, LOCATIONS,
  MOUNTING_LABELS, MOUNTINGS, TEXT_LIMITS, WINDOW_SIDE_LABELS, WINDOW_SIDES, type AccessChoice,
} from '@/features/services/constants/installation';
import { createEmptyPlacement, type PlacementFormValues } from '@/features/services/schemas/placement.schema';
import { RadioGroup, TextField, toOptions, type ChoiceOption } from '@/features/services/components/fields';
import styles from './placementPicker.module.css';

const LOCATION_OPTIONS = toOptions(LOCATIONS, LOCATION_LABELS);
// Mur : échelles seulement
const WALL_ACCESS_OPTIONS: ChoiceOption<AccessChoice>[] = toOptions(LADDERS, LADDER_LABELS);
const WINDOW_BALCONY_ACCESS_OPTIONS = toOptions(ACCESS_CHOICES, ACCESS_LABELS);
const MOUNTING_OPTIONS = toOptions(MOUNTINGS, MOUNTING_LABELS);
const WINDOW_SIDE_OPTIONS = toOptions(WINDOW_SIDES, WINDOW_SIDE_LABELS);

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
        options={LOCATION_OPTIONS}
        value={location}
        // Nouvel emplacement : toutes les sous-options repartent de zéro
        onChange={(next) => onChange({ ...createEmptyPlacement(), location: next })}
        error={errors.location}
        required
      />

      {location === 'wall' && (
        <div className={styles.subOptions}>
          <RadioGroup
            legend="Accès"
            options={WALL_ACCESS_OPTIONS}
            value={value.access}
            onChange={(v) => set('access', v)}
            error={errors.access}
            required
          />
          <RadioGroup
            legend="Méthode de fixation"
            options={MOUNTING_OPTIONS}
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
            legend="Accès"
            options={WINDOW_BALCONY_ACCESS_OPTIONS}
            value={value.access}
            onChange={handleAccessChange}
            error={errors.access}
            required
          />
          {value.access === 'phoneAppointment' && (
            <TextField
              label="Coordonnées pour la prise de rendez-vous"
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
              label="Informations sur la boîte à clés"
              placeholder="Ex. : code, emplacement de la boîte…"
              value={value.keyboxInfo}
              onChange={(v) => set('keyboxInfo', v)}
              maxLength={TEXT_LIMITS.keyboxAccess}
              error={errors.keyboxInfo}
              required
            />
          )}
          {location === 'window' && (
            <RadioGroup
              legend="Emplacement sur la fenêtre"
              options={WINDOW_SIDE_OPTIONS}
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
            label="Veuillez décrire l'emplacement"
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