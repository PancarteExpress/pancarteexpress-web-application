'use client';

import { useId, type ReactNode } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { KEYBOX_CODE_MAX_DIGITS } from '@/features/services/constants/installation';
import {
  MAX_REMOVAL_DIRECTIONALS, MAX_REMOVAL_FLAGS, MAX_REMOVAL_KEYBOXES, REMOVAL_TEXT_LIMITS,
} from '@/features/services/constants/removal';
import { createRemovalDirectional } from '@/features/services/schemas/removal.schema';
import { QuantityField, TextField } from '@/features/services/components/fields';
import { bindRemovalField, useRemovalFormContext } from './formContext';
import styles from '../installationForm/installationForm.module.css';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

/* ---------- Boîtes à clés ---------- */

export function RemovalKeyboxSection() {
  const { control } = useRemovalFormContext();

  return (
    <Section title="Détails du retrait de boîtes à clés">
      <Controller
        control={control}
        name="keybox.quantity"
        render={({ field, fieldState }) => (
          <QuantityField
            label="Combien de boîtes à clés voulez-vous retirer ?"
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_REMOVAL_KEYBOXES}
            hint={`Max ${MAX_REMOVAL_KEYBOXES}`}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="keybox.code"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            // Chiffres seulement, longueur maximale imposée à la saisie
            onChange={(value) => props.field.onChange(value.replace(/\D/g, '').slice(0, KEYBOX_CODE_MAX_DIGITS))}
            label="Veuillez indiquer le code des boîtes à clés"
            placeholder="Entrez le code ici…"
            inputMode="numeric"
            hint={`${KEYBOX_CODE_MAX_DIGITS} chiffres maximum.`}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="keybox.placement"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label="Veuillez indiquer l'emplacement de la boîte à clés"
            maxLength={REMOVAL_TEXT_LIMITS.keyboxPlacement}
            multiline
            rows={2}
          />
        )}
      />
    </Section>
  );
}

/* ---------- Drapeaux ---------- */

export function RemovalFlagsSection() {
  const { control } = useRemovalFormContext();

  return (
    <Section title="Détails du retrait des drapeaux">
      <Controller
        control={control}
        name="flags.quantity"
        render={({ field, fieldState }) => (
          <QuantityField
            label="Combien de drapeaux voulez-vous retirer ?"
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={MAX_REMOVAL_FLAGS}
            hint={`Max ${MAX_REMOVAL_FLAGS}`}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="flags.placement"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label="Veuillez indiquer l'emplacement des drapeaux"
            maxLength={REMOVAL_TEXT_LIMITS.flagsPlacement}
            multiline
            rows={2}
          />
        )}
      />
    </Section>
  );
}

/* ---------- Directionnelles ---------- */

export function RemovalDirectionalsSection() {
  const { control } = useRemovalFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'directionals.units' });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createRemovalDirectional), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <Section title="Détails du retrait des directionnelles">
      <QuantityField
        label="Combien de directionnelles voulez-vous retirer ?"
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_REMOVAL_DIRECTIONALS}
        hint={`Max ${MAX_REMOVAL_DIRECTIONALS}`}
      />
      {fields.map((field, index) => (
        <Controller
          key={field.id}
          control={control}
          name={`directionals.units.${index}.placement`}
          render={(props) => (
            <TextField
              {...bindRemovalField(props)}
              label={`Veuillez indiquer l'emplacement de la directionnelle #${index + 1}`}
              placeholder="Ex. : Newman et Léger"
              maxLength={REMOVAL_TEXT_LIMITS.directionalPlacement}
              multiline
              rows={2}
            />
          )}
        />
      ))}
    </Section>
  );
}

/* ---------- Autres ---------- */

export function RemovalOtherSection() {
  const { control } = useRemovalFormContext();

  return (
    <Section title="Détails du retrait spécial">
      <Controller
        control={control}
        name="otherDetails"
        render={(props) => (
          <TextField
            {...bindRemovalField(props)}
            label="Veuillez indiquer les détails"
            maxLength={REMOVAL_TEXT_LIMITS.otherDetails}
            multiline
            rows={3}
            required
          />
        )}
      />
    </Section>
  );
}