'use client';

import { useId, useImperativeHandle, useState, type Ref } from 'react';
import {
  Controller, useFieldArray, useForm, useWatch, type Control, type UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_ADDONS, DELIVERY_DIRECTIONAL_MODELS, DELIVERY_FRAME_MODELS, DELIVERY_LIMITS, DELIVERY_MATERIALS,
  DELIVERY_TEXT_LIMITS, REPEATABLE_ADDONS, REPEATABLE_DIRECTIONAL_MODELS, REPEATABLE_FRAME_MODELS,
  type DeliveryMaterial,
} from '@/features/services/constants/delivery';
import { KEYBOX_CODE_MAX_DIGITS } from '@/features/services/constants/installation';
import {
  createDeliveryAddon, createDeliveryDirectional, createDeliveryFrame, createDeliveryOther,
  createEmptyDeliveryForm, deliverySchema, toDeliveryFormValues, type DeliveryFormValues,
} from '@/features/services/schemas/delivery.schema';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import { CheckboxGroup } from '@/features/services/components/fields/CheckboxGroup';
import { QuantityField } from '@/features/services/components/fields/QuantityField';
import { RadioGroup } from '@/features/services/components/fields/RadioGroup';
import { TextField } from '@/features/services/components/fields/TextField';
import { YesNoField } from '@/features/services/components/fields/YesNoField';
import { toOptions, type ChoiceOption } from '@/features/services/components/fields/types';
import type { ServiceFormHandle } from '../serviceForm/serviceFormHandle';
import { useAutoSave, type AutoSaveHandler } from '../serviceForm/useAutoSave';
import formStyles from '../installationForm/installationForm.module.css';
import styles from './deliveryForm.module.css';

type Values = DeliveryFormValues;
type SectionProps = {
  control: Control<Values, unknown, DeliveryDetails>;
  setValue: UseFormSetValue<Values>;
  validate: boolean;
};

/** Désactive les choix déjà pris par une autre ligne (sauf les modèles libres) */
function withTaken<T extends string>(
  options: ChoiceOption<T>[], chosen: (T | null)[], index: number, repeatable: readonly string[],
): ChoiceOption<T>[] {
  const taken = new Set(chosen.filter((v, j): v is T => j !== index && v !== null && !repeatable.includes(v)));
  return options.map((o) => ({ ...o, disabled: o.disabled || taken.has(o.value) }));
}

/** Premier modèle encore libre, pour qu'un nouveau modèle ne soit jamais un doublon d'office */
function firstFree<T extends string>(models: readonly T[], chosen: (T | null)[], fallback: T): T {
  return models.find((m) => m !== fallback && !chosen.includes(m)) ?? fallback;
}

interface DeliveryFormProps {
  handle: Ref<ServiceFormHandle<DeliveryDetails>>;
  initialValues?: DeliveryDetails;
  /** Saisie en cours, reprise telle quelle (prioritaire sur initialValues) */
  draft?: DeliveryFormValues;
  onAutoSave: AutoSaveHandler<DeliveryFormValues, DeliveryDetails>;
}

export function DeliveryForm({ handle, initialValues, draft, onAutoSave }: DeliveryFormProps) {
  const headingId = useId();
  const t = useTranslations('services.delivery');
  const [defaultValues] = useState(() =>
    draft ?? (initialValues ? toDeliveryFormValues(initialValues) : createEmptyDeliveryForm()),
  );

  const { control, handleSubmit, setValue, formState, watch, getValues } = useForm<Values, unknown, DeliveryDetails>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
    shouldFocusError: true,
  });
  useAutoSave(watch, getValues, deliverySchema, onAutoSave);
  const materials = useWatch({ control, name: 'materials' });
  const validate = formState.isSubmitted;

  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<DeliveryDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);

  /** Cocher un matériel crée son premier modèle ; le décocher efface ses réponses */
  const handleMaterialsChange = (next: DeliveryMaterial[]) => {
    const options = { shouldDirty: true, shouldValidate: validate };
    for (const m of DELIVERY_MATERIALS) {
      const added = next.includes(m) && !materials.includes(m);
      const removed = !next.includes(m) && materials.includes(m);
      if (!added && !removed) continue;
      switch (m) {
        case 'frames':
          setValue('frames', added ? [createDeliveryFrame()] : [], options);
          break;
        case 'addons':
          setValue('addons', added ? [createDeliveryAddon()] : [], options);
          break;
        case 'keybox':
          setValue('keybox', { quantity: 1, code: '' }, options);
          break;
        case 'directional':
          setValue('directionals', added ? [createDeliveryDirectional()] : [], options);
          break;
        case 'other':
          setValue('others', added ? [createDeliveryOther()] : [], options);
          break;
      }
    }
    setValue('materials', next, options);
  };

  const sectionProps: SectionProps = { control, setValue, validate };

  return (
    <form noValidate className={formStyles.form} onSubmit={(e) => e.preventDefault()}>
      <section aria-labelledby={headingId} className={formStyles.section}>
        <h3 id={headingId} className={formStyles.sectionTitle}>{t('title')}</h3>

        <Controller
          control={control}
          name="materials"
          render={({ field, fieldState }) => (
            <CheckboxGroup
              legend={t('materialsLegend')}
              options={toOptions(DELIVERY_MATERIALS, (m) => t(`materials.${m}`))}
              value={field.value}
              onChange={handleMaterialsChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              required
            />
          )}
        />

        {materials.includes('frames') && <FramesSection {...sectionProps} />}
        {materials.includes('addons') && <AddonsSection {...sectionProps} />}
        {materials.includes('keybox') && <KeyboxSection {...sectionProps} />}
        {materials.includes('directional') && <DirectionalsSection {...sectionProps} />}
        {materials.includes('other') && <OthersSection {...sectionProps} />}
      </section>
    </form>
  );
}

/* ==========================================================================
   Éléments communs aux listes
   ========================================================================== */

function ListActions({ count, max, onAdd, addLabel, maxLabel, error }: {
  count: number; max: number; onAdd: () => void; addLabel: string; maxLabel: string; error?: string;
}) {
  const tErrors = useTranslations('services.errors');
  return (
    <div className={styles.listActions}>
      <button type="button" className={styles.addButton} onClick={onAdd} disabled={count >= max}>
        + {addLabel}
      </button>
      <span className={styles.maxHint}>{maxLabel}</span>
      {/* Erreur de la liste entière (ex. aucun modèle) ; les erreurs de ligne sont sur leurs champs */}
      {error && <p role="alert" className={styles.listError}>{tErrors.has(error) ? tErrors(error) : error}</p>}
    </div>
  );
}

function Unit({ legend, onRemove, removeLabel, children }: {
  legend: string; onRemove?: () => void; removeLabel: string; children: React.ReactNode;
}) {
  return (
    <fieldset className={styles.unit}>
      <legend className={styles.unitLegend}>{legend}</legend>
      {children}
      {onRemove && (
        <button type="button" className={styles.removeButton} onClick={onRemove}>{removeLabel}</button>
      )}
    </fieldset>
  );
}

/* ==========================================================================
   Pancartes
   ========================================================================== */

function FramesSection({ control, setValue, validate }: SectionProps) {
  const t = useTranslations('services.delivery');
  const tServices = useTranslations('services');
  const { fields, append, remove } = useFieldArray({ control, name: 'frames' });
  const frames = useWatch({ control, name: 'frames' });
  const { errors } = control._formState;
  const models = frames.map((f) => f.model);
  const options = toOptions(DELIVERY_FRAME_MODELS, (m) => tServices(`frameModels.${m}`));

  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{t('framesTitle')}</h4>
      {fields.map((field, i) => (
        <Unit
          key={field.id}
          legend={t('modelNumber', { number: i + 1 })}
          removeLabel={t('removeModel')}
          onRemove={i > 0 ? () => remove(i) : undefined}
        >
          <Controller
            control={control}
            name={`frames.${i}.model`}
            render={({ field: f, fieldState }) => (
              <RadioGroup
                legend={t('frameModelLegend')}
                hideLegend
                options={withTaken(options, models, i, REPEATABLE_FRAME_MODELS)}
                value={f.value}
                onChange={(model) => {
                  f.onChange(model);
                  if (model !== 'custom') setValue(`frames.${i}.description`, '', { shouldValidate: validate });
                }}
                inputRef={f.ref}
                error={fieldState.error?.message}
                required
              />
            )}
          />
          {frames[i]?.model === 'custom' && (
            <Controller
              control={control}
              name={`frames.${i}.description`}
              render={({ field: f, fieldState }) => (
                <TextField
                  label={t('describeModel')}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  inputRef={f.ref}
                  maxLength={DELIVERY_TEXT_LIMITS.customModel}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          )}
          <Controller
            control={control}
            name={`frames.${i}.quantity`}
            render={({ field: f, fieldState }) => (
              <QuantityField
                label={t('frameQuantity')}
                value={f.value}
                onChange={f.onChange}
                min={1}
                max={DELIVERY_LIMITS.frameQuantity}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name={`frames.${i}.withAnchorsAndPoles`}
            render={({ field: f, fieldState }) => (
              <YesNoField
                legend={t('withAnchorsAndPoles')}
                value={f.value}
                onChange={f.onChange}
                inputRef={f.ref}
                error={fieldState.error?.message}
                required
              />
            )}
          />
        </Unit>
      ))}
      <ListActions
        count={fields.length}
        max={DELIVERY_LIMITS.frameModels}
        onAdd={() => append({ ...createDeliveryFrame(), model: firstFree(DELIVERY_FRAME_MODELS, models, 'custom') })}
        addLabel={t('addModel')}
        maxLabel={t('maxModels', { max: DELIVERY_LIMITS.frameModels })}
        error={errors.frames?.root?.message ?? errors.frames?.message}
      />
    </div>
  );
}

/* ==========================================================================
   Ajouts
   ========================================================================== */

function AddonsSection({ control, setValue, validate }: SectionProps) {
  const t = useTranslations('services.delivery');
  const { fields, append, remove } = useFieldArray({ control, name: 'addons' });
  const addons = useWatch({ control, name: 'addons' });
  const { errors } = control._formState;
  const chosen = addons.map((a) => a.addon);
  const options = toOptions(DELIVERY_ADDONS, (a) => t(`addons.${a}`));
  const clear = { shouldValidate: validate };

  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{t('addonsTitle')}</h4>
      {fields.map((field, i) => (
        <Unit
          key={field.id}
          legend={t('modelNumber', { number: i + 1 })}
          removeLabel={t('removeModel')}
          onRemove={i > 0 ? () => remove(i) : undefined}
        >
          <Controller
            control={control}
            name={`addons.${i}.addon`}
            render={({ field: f, fieldState }) => (
              <RadioGroup
                legend={t('addonLegend')}
                hideLegend
                options={withTaken(options, chosen, i, REPEATABLE_ADDONS)}
                value={f.value}
                onChange={(addon) => {
                  f.onChange(addon);
                  // Chaque type d'ajout n'a que son propre champ texte
                  if (addon !== 'other') setValue(`addons.${i}.mention`, '', clear);
                  if (addon !== 'customNoMention') setValue(`addons.${i}.customModel`, '', clear);
                }}
                inputRef={f.ref}
                error={fieldState.error?.message}
                required
              />
            )}
          />
          {addons[i]?.addon === 'other' && (
            <Controller
              control={control}
              name={`addons.${i}.mention`}
              render={({ field: f, fieldState }) => (
                <TextField
                  label={t('addonMention')}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  inputRef={f.ref}
                  maxLength={DELIVERY_TEXT_LIMITS.addonMention}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          )}
          {addons[i]?.addon === 'customNoMention' && (
            <Controller
              control={control}
              name={`addons.${i}.customModel`}
              render={({ field: f, fieldState }) => (
                <TextField
                  label={t('customAddonModel')}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  inputRef={f.ref}
                  maxLength={DELIVERY_TEXT_LIMITS.customAddonModel}
                  error={fieldState.error?.message}
                />
              )}
            />
          )}
          <Controller
            control={control}
            name={`addons.${i}.quantity`}
            render={({ field: f, fieldState }) => (
              <QuantityField
                label={t('addonQuantity')}
                value={f.value}
                onChange={f.onChange}
                min={1}
                max={DELIVERY_LIMITS.addonQuantity}
                error={fieldState.error?.message}
              />
            )}
          />
        </Unit>
      ))}
      <ListActions
        count={fields.length}
        max={DELIVERY_LIMITS.addonModels}
        onAdd={() => append(createDeliveryAddon())}
        addLabel={t('addModel')}
        maxLabel={t('maxModels', { max: DELIVERY_LIMITS.addonModels })}
        error={errors.addons?.root?.message ?? errors.addons?.message}
      />
    </div>
  );
}

/* ==========================================================================
   Boîtes à clés
   ========================================================================== */

function KeyboxSection({ control }: SectionProps) {
  const t = useTranslations('services.delivery');
  const tInstallation = useTranslations('services.installation');

  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{t('keyboxTitle')}</h4>
      <Controller
        control={control}
        name="keybox.quantity"
        render={({ field: f, fieldState }) => (
          <QuantityField
            label={t('keyboxQuantity')}
            value={f.value}
            onChange={f.onChange}
            min={1}
            max={DELIVERY_LIMITS.keyboxQuantity}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="keybox.code"
        render={({ field: f, fieldState }) => (
          <TextField
            label={t('keyboxCode')}
            value={f.value}
            onChange={f.onChange}
            onBlur={f.onBlur}
            inputRef={f.ref}
            inputMode="numeric"
            maxLength={KEYBOX_CODE_MAX_DIGITS}
            hint={tInstallation('codeHint', { max: KEYBOX_CODE_MAX_DIGITS })}
            error={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
}

/* ==========================================================================
   Directionnelles
   ========================================================================== */

function DirectionalsSection({ control, setValue, validate }: SectionProps) {
  const t = useTranslations('services.delivery');
  const { fields, append, remove } = useFieldArray({ control, name: 'directionals' });
  const directionals = useWatch({ control, name: 'directionals' });
  const { errors } = control._formState;
  const models = directionals.map((d) => d.model);
  const options = toOptions(DELIVERY_DIRECTIONAL_MODELS, (m) => t(`directionalModels.${m}`));

  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{t('directionalsTitle')}</h4>
      {fields.map((field, i) => (
        <Unit
          key={field.id}
          legend={t('modelNumber', { number: i + 1 })}
          removeLabel={t('removeModel')}
          onRemove={i > 0 ? () => remove(i) : undefined}
        >
          <Controller
            control={control}
            name={`directionals.${i}.model`}
            render={({ field: f, fieldState }) => (
              <RadioGroup
                legend={t('directionalModelLegend')}
                hideLegend
                options={withTaken(options, models, i, REPEATABLE_DIRECTIONAL_MODELS)}
                value={f.value}
                onChange={(model) => {
                  f.onChange(model);
                  if (model !== 'custom') setValue(`directionals.${i}.description`, '', { shouldValidate: validate });
                }}
                inputRef={f.ref}
                error={fieldState.error?.message}
                required
              />
            )}
          />
          {directionals[i]?.model === 'custom' && (
            <Controller
              control={control}
              name={`directionals.${i}.description`}
              render={({ field: f, fieldState }) => (
                <TextField
                  label={t('describeModel')}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  inputRef={f.ref}
                  maxLength={DELIVERY_TEXT_LIMITS.customModel}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          )}
          <Controller
            control={control}
            name={`directionals.${i}.quantity`}
            render={({ field: f, fieldState }) => (
              <QuantityField
                label={t('directionalQuantity')}
                value={f.value}
                onChange={f.onChange}
                min={1}
                max={DELIVERY_LIMITS.directionalQuantity}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name={`directionals.${i}.withPoles`}
            render={({ field: f, fieldState }) => (
              <YesNoField
                legend={t('withPoles')}
                value={f.value}
                onChange={f.onChange}
                inputRef={f.ref}
                error={fieldState.error?.message}
                required
              />
            )}
          />
        </Unit>
      ))}
      <ListActions
        count={fields.length}
        max={DELIVERY_LIMITS.directionalModels}
        onAdd={() => append(createDeliveryDirectional())}
        addLabel={t('addModel')}
        maxLabel={t('maxModels', { max: DELIVERY_LIMITS.directionalModels })}
        error={errors.directionals?.root?.message ?? errors.directionals?.message}
      />
    </div>
  );
}

/* ==========================================================================
   Autres
   ========================================================================== */

function OthersSection({ control }: SectionProps) {
  const t = useTranslations('services.delivery');
  const { fields, append, remove } = useFieldArray({ control, name: 'others' });
  const { errors } = control._formState;

  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{t('othersTitle')}</h4>
      {fields.map((field, i) => (
        <Unit
          key={field.id}
          legend={t('itemNumber', { number: i + 1 })}
          removeLabel={t('removeItem')}
          onRemove={i > 0 ? () => remove(i) : undefined}
        >
          <Controller
            control={control}
            name={`others.${i}.description`}
            render={({ field: f, fieldState }) => (
              <TextField
                label={t('otherDescription')}
                value={f.value}
                onChange={f.onChange}
                onBlur={f.onBlur}
                inputRef={f.ref}
                maxLength={DELIVERY_TEXT_LIMITS.otherDescription}
                error={fieldState.error?.message}
                required
              />
            )}
          />
          <Controller
            control={control}
            name={`others.${i}.quantity`}
            render={({ field: f, fieldState }) => (
              <QuantityField
                label={t('otherQuantity')}
                value={f.value}
                onChange={f.onChange}
                min={1}
                max={DELIVERY_LIMITS.otherQuantity}
                error={fieldState.error?.message}
              />
            )}
          />
        </Unit>
      ))}
      <ListActions
        count={fields.length}
        max={DELIVERY_LIMITS.otherItems}
        onAdd={() => append(createDeliveryOther())}
        addLabel={t('addItem')}
        maxLabel={t('maxItems', { max: DELIVERY_LIMITS.otherItems })}
        error={errors.others?.root?.message ?? errors.others?.message}
      />
    </div>
  );
}