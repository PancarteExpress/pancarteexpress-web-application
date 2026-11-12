'use client';

import { useTranslations } from 'next-intl';
import { CheckboxGroup, Notice, QuantityField, type ChoiceOption, type Columns } from '@/features/services/components/fields';

const ON_SITE = 'onSite';

export interface TargetsValue {
  quantity: number;
  frameUids: string[];
  onSite: boolean;
}

interface TargetsPickerProps {
  /** Nom de l'élément réparti (ex. « 2e étage », « Visite libre ») */
  label: string;
  quantityLabel?: string;
  value: TargetsValue;
  onChange: (value: TargetsValue) => void;
  /** uid des pancartes de la demande, dans l'ordre (vide sans pancartes) */
  frameUids: string[];
  quantityError?: string;
  targetsError?: string;
}

export function TargetsPicker({
  label, quantityLabel, value, onChange, frameUids, quantityError, targetsError,
}: TargetsPickerProps) {
  const t = useTranslations('services.installation');
  const assigned = value.frameUids.length;
  // « Sur place » réserve au moins une unité
  const frameSlots = value.quantity - (value.onSite ? 1 : 0);

  const options: ChoiceOption<string>[] = [
    ...frameUids.map((uid, i) => ({
      value: uid,
      label: t('targetFrame', { number: i + 1 }),
      disabled: !value.frameUids.includes(uid) && assigned >= frameSlots,
    })),
    { value: ON_SITE, label: t('targetOnSite'), disabled: !value.onSite && assigned >= value.quantity },
  ];

  const columns: Columns = frameUids.length >= 3 ? 4 : frameUids.length === 2 ? 3 : frameUids.length === 1 ? 2 : 1;

  const handleQuantity = (quantity: number) => {
    onChange({
      quantity,
      onSite: value.onSite,
      frameUids: value.frameUids.slice(0, value.onSite ? quantity - 1 : quantity),
    });
  };

  const handleTargets = (next: string[]) => {
    onChange({
      quantity: value.quantity,
      frameUids: next.filter((v) => v !== ON_SITE),
      onSite: next.includes(ON_SITE),
    });
  };

  return (
    <>
      <QuantityField label={quantityLabel ?? t('targetsQuantity')} value={value.quantity} onChange={handleQuantity} min={1} error={quantityError} />
      <CheckboxGroup
        legend={t('targetsLegend', { label })}
        hideLegend
        options={options}
        value={value.onSite ? [...value.frameUids, ON_SITE] : value.frameUids}
        onChange={handleTargets}
        columns={columns}
        error={targetsError}
      />

      {/* « Sur place » coché avec moins de choix que d'unités : le reste va aussi sur des pancartes sur place */}
      {frameUids.length > 0 && value.onSite && value.quantity > assigned + 1 && (
        <Notice>
          {t('onSiteAssumption', {
            choices: assigned + 1,
            quantity: value.quantity,
            label,
            extra: value.quantity - assigned - 1,
          })}
        </Notice>
      )}
    </>
  );
}