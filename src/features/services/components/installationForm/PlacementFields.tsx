'use client';

import { useId } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import {
  ACCESS_CHOICES, ACCESS_LABELS, LADDER_LABELS, LADDERS, LOCATION_LABELS, LOCATIONS,
  MOUNTING_LABELS, MOUNTINGS, TEXT_LIMITS, type AccessChoice,
} from '@/features/services/constants/installation';
import { createEmptyPlacement } from '@/features/services/schemas/installation.schema';
import { RadioGroup, TextField, toOptions, type ChoiceOption } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from './formContext';
import styles from './installationForm.module.css';

const LOCATION_OPTIONS = toOptions(LOCATIONS, LOCATION_LABELS);
const WALL_ACCESS_OPTIONS: ChoiceOption<AccessChoice>[] = toOptions(LADDERS, LADDER_LABELS);
const FENCE_ACCESS_OPTIONS = toOptions(ACCESS_CHOICES, ACCESS_LABELS);
const MOUNTING_OPTIONS = toOptions(MOUNTINGS, MOUNTING_LABELS);

/** Emplacement unique de l'installation, commun à tous les matériels. */
export function PlacementFields() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  const location = useWatch({ control, name: 'placement.location' });

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Emplacement de l&apos;installation</h3>

      <Controller
        control={control}
        name="placement.location"
        render={(props) => (
          <RadioGroup
            {...bindField(props)}
            // Un seul setValue : l'emplacement et ses sous-options repartent ensemble de zéro
            onChange={(value) => update('placement', { ...createEmptyPlacement(), location: value })}
            legend="Veuillez indiquer l'emplacement d'installation"
            options={LOCATION_OPTIONS}
            required
          />
        )}
      />

      {location === 'wall' && (
        <div className={styles.subOptions}>
          <Controller
            control={control}
            name="placement.access"
            render={(props) => (
              <RadioGroup {...bindField(props)} legend="Accès" options={WALL_ACCESS_OPTIONS} required />
            )}
          />
          <Controller
            control={control}
            name="placement.mounting"
            render={(props) => (
              <RadioGroup
                {...bindField(props)}
                legend="Méthode de fixation"
                options={MOUNTING_OPTIONS}
                columns={2}
                required
              />
            )}
          />
        </div>
      )}

      {(location === 'fence' || location === 'balcony') && (
        <div className={styles.subOptions}>
          <Controller
            control={control}
            name="placement.access"
            render={(props) => (
              <>
                <RadioGroup
                  {...bindField(props)}
                  onChange={(value) => {
                    props.field.onChange(value);
                    if (value !== 'phoneAppointment') update('placement.contact', '');
                  }}
                  legend="Accès"
                  options={FENCE_ACCESS_OPTIONS}
                  required
                />
                {props.field.value === 'phoneAppointment' && (
                  <Controller
                    control={control}
                    name="placement.contact"
                    render={(p) => (
                      <TextField
                        {...bindField(p)}
                        label="Coordonnées pour la prise de rendez-vous"
                        maxLength={TEXT_LIMITS.appointmentContact}
                        multiline
                        required
                      />
                    )}
                  />
                )}
              </>
            )}
          />
        </div>
      )}

      {location === 'other' && (
        <div className={styles.subOptions}>
          <Controller
            control={control}
            name="placement.description"
            render={(props) => (
              <TextField
                {...bindField(props)}
                label="Veuillez décrire l'emplacement"
                maxLength={TEXT_LIMITS.placementDescription}
                multiline
                required
              />
            )}
          />
        </div>
      )}
    </section>
  );
}