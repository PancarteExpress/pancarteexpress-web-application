'use client';

import { useId } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { KIT_MODEL_LABELS, KIT_MODELS, MAX_KITS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { createKitUnit } from '@/features/services/schemas/installation.schema';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../formContext';
import styles from '../installationForm.module.css';

const KIT_MODEL_OPTIONS = toOptions(KIT_MODELS, KIT_MODEL_LABELS);

export function KitSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'kits.units' });

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createKitUnit), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Détails du kit (sans pancarte)</h3>

      <QuantityField
        label="Combien de kits voulez-vous ?"
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_KITS}
        hint={`Max ${MAX_KITS}`}
      />

      {fields.map((field, index) => (
        <KitUnitFields key={field.id} index={index} />
      ))}
    </section>
  );
}

function KitUnitFields({ index }: { index: number }) {
  const base = `kits.units.${index}` as const;
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();

  return (
    <fieldset className={styles.unit}>
        <legend className={styles.unitTitle}>Détails du kit #{index + 1}</legend>

        

      <Controller
        control={control}
        name={`${base}.model`}
        render={(props) => (
          <>
            <RadioGroup
              {...bindField(props)}
              onChange={(value) => {
                props.field.onChange(value);
                if (value !== 'custom') update(`${base}.description`, '');
              }}
              legend="Quel modèle de poteau voulez-vous ?"
              options={KIT_MODEL_OPTIONS}
              columns={4}
              required
            />
            {props.field.value === 'custom' && (
              <Controller
                control={control}
                name={`${base}.description`}
                render={(p) => (
                  <TextField
                    {...bindField(p)}
                    label="Veuillez décrire votre poteau"
                    maxLength={TEXT_LIMITS.kitDescription}
                    multiline
                    rows={2}
                    required
                  />
                )}
              />
            )}
          </>
        )}
      />
    </fieldset>
  );
}