import { useTranslations } from 'next-intl';
import type { RemovalDetails } from '@/features/services/types/removal';
import { describePlacement } from '@/features/services/utils/placement';
import styles from '../servicesSummary.module.css';

export function RemovalSummary({ details }: { details: RemovalDetails }) {
  const { frames, addons, keybox, flags, directionals, otherDetails } = details;
  const t = useTranslations('services');

  return (
    <div className={styles.installation}>
      {frames && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.framesToRemove', { count: frames.units.length })}</h4>
          <p className={styles.muted}>{t('summary.addonsIncluded')}</p>
          <dl className={styles.list}>
            {frames.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>{t('summary.frame', { number: i + 1 })}</dt>
                <dd>{describePlacement(u.placement, t)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {addons && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.addonsToRemove', { count: addons.units.length })}</h4>
          {addons.details && <p className={styles.prose}>{addons.details}</p>}
          <dl className={styles.list}>
            {addons.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>{t('summary.addon', { number: i + 1 })}</dt>
                <dd>{describePlacement(u.placement, t)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {keybox && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.keyboxesToRemove', { count: keybox.quantity })}</h4>
          <dl className={styles.list}>
            <dt>{t('summary.code')}</dt>
            <dd>{keybox.code}</dd>
            <dt>{t('summary.placement')}</dt>
            <dd>{keybox.placement || t('common.notSpecified')}</dd>
          </dl>
        </section>
      )}

      {flags && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.flagsToRemove', { count: flags.quantity })}</h4>
          <dl className={styles.list}>
            <dt>{t('summary.placement')}</dt>
            <dd>{flags.placement || t('common.notSpecified')}</dd>
          </dl>
        </section>
      )}

      {directionals && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.directionalsToRemove', { count: directionals.units.length })}</h4>
          <dl className={styles.list}>
            {directionals.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>{t('summary.directional', { number: i + 1 })}</dt>
                <dd>{u.placement || t('common.notSpecified')}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {otherDetails && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.specialRemoval')}</h4>
          <p className={styles.prose}>{otherDetails}</p>
        </section>
      )}
    </div>
  );
}