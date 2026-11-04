import { PICKUP_MATERIAL_LABELS } from '@/features/services/constants/pickup';
import type { PickupDetails } from '@/features/services/types/pickup';
import styles from '../servicesSummary.module.css';

export function PickupSummary({ details }: { details: PickupDetails }) {
  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>À ramasser</dt>
        <dd>{details.materials.map((m) => PICKUP_MATERIAL_LABELS[m]).join(', ')}</dd>
        <dt>Nouveaux modèles</dt>
        <dd>{details.newModels ? 'Oui' : 'Non'}</dd>
      </dl>
      {details.details && <p className={styles.prose}>{details.details}</p>}
    </div>
  );
}