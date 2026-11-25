'use client';

import { useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useFormUpdater, useInstallationFormContext } from '../../formContext';
import { TargetsPicker } from './TargetsPicker';
import { MultiplePlacementFields } from '../../placementFields/multiplePlacementFields';
import styles from '../../installationForm.module.css';

export function OpenHouseAssignmentRow({ frameUids }: { frameUids: string[] }) {
  const { control } = useInstallationFormContext();
  const update = useFormUpdater();
  // Abonnement aux seuls champs de répartition : taper un emplacement de directionnelle ne redessine pas cette ligne
  const quantity = useWatch({ control, name: 'openHouse.quantity' });
  const targetUids = useWatch({ control, name: 'openHouse.frameUids' });
  const onSite = useWatch({ control, name: 'openHouse.onSite' });
  const placements = useWatch({ control, name: 'openHouse.placements' });
  const { errors } = useFormState({ control, name: 'openHouse' });
  const e = errors.openHouse;
  const t = useTranslations('services.materials');
  const tInstallation = useTranslations('services.installation');
  // Affichettes prévues sur des pancartes déjà sur place : leur emplacement est demandé
  const onSiteUnits = Math.max(1, quantity - targetUids.length);

  return (
    <fieldset className={styles.unit}>
      <legend className={styles.unitTitle}>{t('openHouse')}</legend>
      <TargetsPicker
        label={t('openHouse')}
        value={{ quantity, frameUids: targetUids, onSite }}
        onChange={(t) => {
          update('openHouse.quantity', t.quantity);
          update('openHouse.frameUids', t.frameUids);
          update('openHouse.onSite', t.onSite);
          // Pas plus d'emplacements que d'affichettes sur place
          const max = Math.max(1, t.quantity - t.frameUids.length);
          if (placements.length > max) update('openHouse.placements', placements.slice(0, max));
        }}
        frameUids={frameUids}
        quantityError={e?.quantity?.message}
        targetsError={e?.frameUids?.message ?? e?.onSite?.message}
      />

      {/* « Pancarte déjà sur place » coché : on demande où se trouvent ces pancartes */}
      {onSite && (
        <MultiplePlacementFields
          name="openHouse.placements"
          quantity={onSiteUnits}
          label={t('openHouse')}
          legend={tInstallation('onSitePlacementsLegend', { count: onSiteUnits })}
          hint={tInstallation('onSitePlacementsHint')}
        />
      )}
    </fieldset>
  );
}