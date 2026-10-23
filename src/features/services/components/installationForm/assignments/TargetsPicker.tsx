'use client';

import { CheckboxGroup, QuantityField, type ChoiceOption, type Columns } from '@/features/services/components/fields';

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
  label, quantityLabel = 'Quantité', value, onChange, frameUids, quantityError, targetsError,
}: TargetsPickerProps) {
  const assigned = value.frameUids.length;
  // « Sur place » réserve au moins une unité
  const frameSlots = value.quantity - (value.onSite ? 1 : 0);

  const options: ChoiceOption<string>[] = [
    ...frameUids.map((uid, i) => ({
      value: uid,
      label: `Pancarte ${i + 1}`,
      disabled: !value.frameUids.includes(uid) && assigned >= frameSlots,
    })),
    { value: ON_SITE, label: 'Pancarte déjà sur place', disabled: !value.onSite && assigned >= value.quantity },
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
      <QuantityField label={quantityLabel} value={value.quantity} onChange={handleQuantity} min={1} error={quantityError} />
      <CheckboxGroup
        legend={`Pancartes qui recevront « ${label} »`}
        hideLegend
        options={options}
        value={value.onSite ? [...value.frameUids, ON_SITE] : value.frameUids}
        onChange={handleTargets}
        columns={columns}
        error={targetsError}
      />
    </>
  );
}