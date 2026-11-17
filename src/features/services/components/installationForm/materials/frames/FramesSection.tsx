'use client';

import { useId } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_FRAMES } from '@/features/services/constants/installation';
import { createFrameUnit } from '@/features/services/schemas/installation.schema';
import { QuantityField } from '@/features/services/components/fields';
import { useFormUpdater, useInstallationFormContext } from '../../formContext';
import { FrameUnitFields } from './FrameUnitFields';

import { FaSignHanging } from "react-icons/fa6";

import styles from '../../installationForm.module.css';

interface FramesSectionProps {
  isMember: boolean;
  accountName: string | null;
}

export function FramesSection({ isMember, accountName }: FramesSectionProps) {
  const headingId = useId();
  const { control, getValues } = useInstallationFormContext();
  const update = useFormUpdater();
  const { fields, append, remove } = useFieldArray({ control, name: 'frames.units' });
  const t = useTranslations('services');

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
    update('openHouse.frameUids', getValues('openHouse.frameUids').filter((uid) => !removedUids.has(uid)));
  };

  return (
    <section aria-labelledby={headingId} className={styles.material}>
      <h3 id={headingId} className={styles.title}><FaSignHanging size={24} /> {t('installation.framesTitle')}</h3>

      <div style={{margin : '10px 0' }}>
        <QuantityField
          label={t('installation.framesQuantity')}
          value={fields.length}
          onChange={handleQuantityChange}
          min={1}
          max={MAX_FRAMES}
          hint={t('common.max', { max: MAX_FRAMES })}
        />

        {fields.map((field, index) => (
          <FrameUnitFields key={field.id} index={index} isMember={isMember} accountName={accountName} />
        ))}
      </div>
    </section>
  );
}
