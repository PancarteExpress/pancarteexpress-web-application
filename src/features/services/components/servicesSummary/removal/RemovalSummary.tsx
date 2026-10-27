import type { RemovalDetails } from '@/features/services/types/removal';
import { describePlacement } from '../installation/installationSummary';
import styles from '../servicesSummary.module.css';

export function RemovalSummary({ details }: { details: RemovalDetails }) {
  const { frames, addons, keybox, flags, directionals, otherDetails } = details;

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

      {addons && (
        <section>
          <h4 className={styles.subtitle}>Ajouts à retirer ({addons.units.length})</h4>
          {addons.details && <p className={styles.prose}>{addons.details}</p>}
          <dl className={styles.list}>
            {addons.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>Ajout {i + 1}</dt>
                <dd>{describePlacement(u.placement)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {keybox && (
        <section>
          <h4 className={styles.subtitle}>Boîtes à clés à retirer ({keybox.quantity})</h4>
          <dl className={styles.list}>
            <dt>Code</dt>
            <dd>{keybox.code}</dd>
            <dt>Emplacement</dt>
            <dd>{keybox.placement || 'Non précisé'}</dd>
          </dl>
        </section>
      )}

      {flags && (
        <section>
          <h4 className={styles.subtitle}>Drapeaux à retirer ({flags.quantity})</h4>
          <dl className={styles.list}>
            <dt>Emplacement</dt>
            <dd>{flags.placement || 'Non précisé'}</dd>
          </dl>
        </section>
      )}

      {directionals && (
        <section>
          <h4 className={styles.subtitle}>Directionnelles à retirer ({directionals.units.length})</h4>
          <dl className={styles.list}>
            {directionals.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>Directionnelle {i + 1}</dt>
                <dd>{u.placement || 'Non précisé'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {otherDetails && (
        <section>
          <h4 className={styles.subtitle}>Retrait spécial</h4>
          <p className={styles.prose}>{otherDetails}</p>
        </section>
      )}
    </div>
  );
}