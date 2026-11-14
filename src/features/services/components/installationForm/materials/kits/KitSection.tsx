'use client';

import { useId } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { KIT_MODELS, MAX_KITS, TEXT_LIMITS } from '@/features/services/constants/installation';
import { createKitUnit } from '@/features/services/schemas/installation.schema';
import { UnitPlacementField } from '../../placementFields/unitPlacementField';
import { QuantityField, RadioGroup, TextField, toOptions } from '@/features/services/components/fields';
import { bindField, useFormUpdater, useInstallationFormContext } from '../../formContext';
import styles from '../../installationForm.module.css';

export function KitSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'kits.units' });
  const t = useTranslations('services');

  const handleQuantityChange = (next: number) => {
    const current = fields.length;
    if (next > current) {
      append(Array.from({ length: next - current }, createKitUnit), { shouldFocus: false });
    } else {
      remove(Array.from({ length: current - next }, (_, i) => next + i));
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}>{t('installation.kitTitle')}</h3>

      <QuantityField
        label={t('installation.kitsQuantity')}
        value={fields.length}
        onChange={handleQuantityChange}
        min={1}
        max={MAX_KITS}
        hint={t('common.max', { max: MAX_KITS })}
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
  const t = useTranslations('services');

  return (
    <fieldset className={styles.unit}>
        <legend className={styles.unitTitle}>{t('installation.kitUnitTitle', { number: index + 1 })}</legend>

        

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
              legend={t('installation.kitModelLegend')}
              options={toOptions(KIT_MODELS, (m) => t(`kitModels.${m}`))}
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
                    label={t('installation.kitDescription')}
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

      {/* Emplacement propre à ce kit, en dernier */}
      <UnitPlacementField name={`${base}.placement`} />
    </fieldset>
  );
}