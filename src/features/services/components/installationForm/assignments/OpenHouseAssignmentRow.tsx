'use client';

import { useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useFormUpdater, useInstallationFormContext } from '../formContext';
import { TargetsPicker } from './TargetsPicker';
import styles from '../installationForm.module.css';

export function OpenHouseAssignmentRow({ frameUids }: { frameUids: string[] }) {
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  // Abonnement aux seuls champs de répartition : taper un emplacement de directionnelle ne redessine pas cette ligne
  const quantity = useWatch({ control, name: 'openHouse.quantity' });
  const targetUids = useWatch({ control, name: 'openHouse.frameUids' });
  const onSite = useWatch({ control, name: 'openHouse.onSite' });
  const { errors } = useFormState({ control, name: 'openHouse' });
  const e = errors.openHouse;
  const t = useTranslations('services.materials');

  return (
    <fieldset className={styles.assignment}>
      <legend className={styles.unitTitle}>{t('openHouse')}</legend>
      <TargetsPicker
        label={t('openHouse')}
        value={{ quantity, frameUids: targetUids, onSite }}
        onChange={(t) => {
          update('openHouse.quantity', t.quantity);
          update('openHouse.frameUids', t.frameUids);
          update('openHouse.onSite', t.onSite);
        }}
        frameUids={frameUids}
        quantityError={e?.quantity?.message}
        targetsError={e?.frameUids?.message ?? e?.onSite?.message}
      />
    </fieldset>
  );
}