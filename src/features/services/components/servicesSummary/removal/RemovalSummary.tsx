import type { RemovalDetails } from '@/features/services/types/removal';
import { describePlacement } from '../installation/installationSummary';
import styles from '../servicesSummary.module.css';

export function RemovalSummary({ details }: { details: RemovalDetails }) {
  const { frames } = details;

  return (
    <div className={styles.installation}>
      {frames && (
        <section>
          <h4 className={styles.subtitle}>Pancartes à retirer ({frames.units.length})</h4>
          <p className={styles.muted}>Ajouts inclus.</p>
          <dl className={styles.list}>
            {frames.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>Pancarte {i + 1}</dt>
                <dd>{describePlacement(u.placement)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}