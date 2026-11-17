import { useTranslations } from 'next-intl';
import type { RemovalDetails } from '@/features/services/types/removal';
import { describePlacement } from '@/features/services/utils/placement';
import styles from '../servicesSummary.module.css';
import { Field, Fields, Prose, SubSection, TextOrEmpty, UnitCard, UnitGrid } from '../SummaryParts';

export function RemovalSummary({ details }: { details: RemovalDetails }) {
  const { afterRemoval, frames, addons, keybox, flags, directionals, otherDetails } = details;
  const t = useTranslations('services');
  const notSpecified = t('common.notSpecified');

  return (
    <div className={styles.installation}>
      {/* Invités : que faire du matériel retiré (null pour un membre ou un ancien retrait) */}
      {afterRemoval && (
        <SubSection title={t('summary.afterRemoval')}>
          <Fields>
            <Field label={t('summary.afterRemovalChoice')} wide>
              {t(`removal.afterRemoval.choices.${afterRemoval.choice}`)}
            </Field>
            {afterRemoval.choice === 'deliver' && (
              <Field label={t('summary.deliveryAddress')} wide>{afterRemoval.address}</Field>
            )}
            {afterRemoval.choice !== 'storage' && afterRemoval.dropOff && (
              <Field label={t('summary.dropOff')} wide>{afterRemoval.dropOff}</Field>
            )}
          </Fields>
        </SubSection>
      )}

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
            <Field label={t('summary.mention')} wide>
              {flags.mention === 'other'
                ? t('summary.labelWithDetail', { label: t('mentions.other'), detail: flags.customMention })
                : flags.mention
                  ? t(`mentions.${flags.mention}`)
                  : <TextOrEmpty value={null} emptyLabel={notSpecified} />}
            </Field>
            <Field label={t('summary.placement')} wide>
              <TextOrEmpty value={flags.placement} emptyLabel={notSpecified} />
            </Field>
          </Fields>
        </SubSection>
      )}

      {directionals && (
        <SubSection
          title={t('summary.directionalsToRemove', { count: directionals.units.length })}
          // Retraits enregistrés avant cette question : pas de mention
          note={directionals.mention ? t(`mentions.${directionals.mention}`) : undefined}
        >
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
