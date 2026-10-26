'use client';

import { useId } from 'react';
import { useWatch } from 'react-hook-form';
import { useFrameUids, useInstallationFormContext } from '../formContext';
import { AddonAssignmentRow } from './AddonAssignmentRow';
import { OpenHouseAssignmentRow } from './OpenHouseAssignmentRow';
import styles from '../installationForm.module.css';

/** Répartition de tout ce qui se pose sur une pancarte : ajouts et visite libre. */
export function AssignmentsSection() {
  const headingId = useId();
  const { control } = useInstallationFormContext();
  const frameUids = useFrameUids();
  const materials = useWatch({ control, name: 'materials' });
  const addons = useWatch({ control, name: 'addons' });

  const showAddons = materials.includes('addons') && addons.length > 0;
  const showOpenHouse = materials.includes('openHouse');

  if (!showAddons && !showOpenHouse) return null;

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.sectionTitle}>Veuillez confirmer les ajouts par pancarte</h3>

      {showAddons &&
        addons.map((a, i) => (
          <AddonAssignmentRow key={`${a.addon}-${i}`} index={i} frameUids={frameUids} />
        ))}
      {showOpenHouse && <OpenHouseAssignmentRow frameUids={frameUids} />}
    </section>
  );
}