'use client';

import { useId } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import { MAX_FRAMES } from '@/features/services/constants/installation';
import { createFrameUnit } from '@/features/services/schemas/installation.schema';
import { Notice, QuantityField, YesNoField } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import { FrameUnitFields } from './FrameUnitFields';
import styles from '../installationForm.module.css';

interface FramesSectionProps {
  isMember: boolean;
  accountName: string | null;
}

export function FramesSection({ isMember, accountName }: FramesSectionProps) {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();
  const { fields, append, remove } = useFieldArray({ control, name: 'frames.units' });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;

    if (next > current) {
      // shouldFocus: false → le focus reste dans le champ quantité pendant la saisie
      append(Array.from({ length: next - current }, createFrameUnit), { shouldFocus: false });
      return;
    }

    const removedUids = new Set(getValues('frames.units').slice(next).map((u) => u.uid));
    remove(Array.from({ length: current - next }, (_, i) => next + i));

    // Une pancarte supprimée ne peut plus recevoir d'ajout
    const addons = getValues('addons');
    if (addons.length > 0) {
      update('addons', addons.map((a) => ({
        ...a,
        frameUids: a.frameUids.filter((uid) => !removedUids.has(uid)),
      })));
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails des pancartes</h3>

      {!isMember && <PickupFields />}

      <QuantityField
        label="Combien de pancartes voulez-vous ?"
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_FRAMES}
        hint={`Max ${MAX_FRAMES}`}
      />

      {/* Temporaire : remplacé par FrameUnitFields à l'étape 3c */}
      {fields.map((field, index) => (
        <FrameUnitFields key={field.id} index={index} isMember={isMember} accountName={accountName} />
      ))}
    </section>
  );
}

function PickupFields() {
  const addressId = useId();
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();

  return (
    <Controller
      control={control}
      name="frames.pickup"
      render={(props) => (
        <>
          <YesNoField
            {...bindField(props)}
            onChange={(value) => {
              props.field.onChange(value);
              if (!value) update('frames.pickupAddress', '');
            }}
            legend="Devons-nous aller chercher le matériel à installer (pancartes, ancrages, poteaux) à une autre adresse ?"
            required
          />

          {props.field.value === true && (
            <Controller
              control={control}
              name="frames.pickupAddress"
              render={({ field, fieldState }) => {
                const errorId = `${addressId}-error`;
                return (
                <div className={styles.pickup}>
                  <Notice>Un montant supplémentaire basé sur la distance du déplacement sera appliqué.</Notice>
                  <label htmlFor={addressId} className={styles.label}>
                    Adresse de ramassage <span aria-hidden="true" className={styles.required}>*</span>
                  </label>
                  <AddressAutocomplete 
                    id={addressId} 
                    value={field.value} 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref} 
                    aria-invalid={Boolean(fieldState.error) || undefined}
                    aria-describedby={fieldState.error ? errorId : undefined}
                  />
                  {fieldState.error && <p id={errorId} className={styles.error}>{fieldState.error.message}</p>}
                </div>
                );
              }}
            />
          )}
        </>
      )}
    />
  );
}