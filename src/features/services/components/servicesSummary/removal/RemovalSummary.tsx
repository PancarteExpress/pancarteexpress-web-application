import { useTranslations } from 'next-intl';
import type { RemovalDetails } from '@/features/services/types/removal';
import { describePlacement } from '@/features/services/utils/placement';
import styles from '../servicesSummary.module.css';
import { Field, Fields, Prose, SubSection, TextOrEmpty, UnitCard, UnitGrid } from '../SummaryParts';

export function RemovalSummary({ details }: { details: RemovalDetails }) {
  const { frames, addons, keybox, flags, directionals, otherDetails } = details;
  const t = useTranslations('services');
  const notSpecified = t('common.notSpecified');

  return (
    <div className={styles.installation}>
      {frames && (
        <SubSection title={t('summary.framesToRemove', { count: frames.units.length })} note={t('summary.addonsIncluded')}>
          <UnitGrid>
            {frames.units.map((u, i) => (
              <UnitCard key={u.uid} title={t('summary.frame', { number: i + 1 })}>
                <p className={styles.muted}>{describePlacement(u.placement, t)}</p>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {addons && (
        <SubSection title={t('summary.addonsToRemove', { count: addons.units.length })}>
          {addons.details && <Prose>{addons.details}</Prose>}
          <UnitGrid>
            {addons.units.map((u, i) => (
              <UnitCard key={u.uid} title={t('summary.addon', { number: i + 1 })}>
                <p className={styles.muted}>{describePlacement(u.placement, t)}</p>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {keybox && (
        <SubSection title={t('summary.keyboxesToRemove', { count: keybox.quantity })}>
          <Fields>
            <Field label={t('summary.code')}>{keybox.code}</Field>
            <Field label={t('summary.placement')}>
              <TextOrEmpty value={keybox.placement} emptyLabel={notSpecified} />
            </Field>
          </Fields>
        </SubSection>
      )}

      {flags && (
        <SubSection title={t('summary.flagsToRemove', { count: flags.quantity })}>
          <Fields>
            <Field label={t('summary.placement')} wide>
              <TextOrEmpty value={flags.placement} emptyLabel={notSpecified} />
            </Field>
          </Fields>
        </SubSection>
      )}

      {directionals && (
        <SubSection title={t('summary.directionalsToRemove', { count: directionals.units.length })}>
          <UnitGrid>
            {directionals.units.map((u, i) => (
              <UnitCard key={u.uid} title={t('summary.directional', { number: i + 1 })}>
                <p className={styles.muted}><TextOrEmpty value={u.placement} emptyLabel={notSpecified} /></p>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {otherDetails && (
        <SubSection title={t('summary.specialRemoval')}>
          <Prose>{otherDetails}</Prose>
        </SubSection>
      )}
    </div>
  );
}
