import { useFormatter, useTranslations } from 'next-intl';
import type {
  AddonAssignment, FrameDisplayName, FrameModel, InstallationDetails, KitModel, UnitTargets,
} from '@/features/services/types/installation';
import { describePlacement, type ServicesTranslator } from '@/features/services/utils/placement';
import { removalDayAfter } from '@/features/services/utils/time';
import { formatIsoDay } from '@/features/services/utils/formatDay';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import styles from '../servicesSummary.module.css';
import {
  Field, Fields, Panel, Pill, Prose, SubSection, TextOrEmpty, UnitCard, UnitGrid, UnitRow, UnitRows,
} from '../SummaryParts';

/* ---------- Formatage (fonctions pures, t = useTranslations('services')) ---------- */

function describeKitModel(model: KitModel, t: ServicesTranslator): string {
  const label = t(`kitModels.${model.type}`);
  return model.type === 'custom' ? t('summary.labelWithDescription', { label, description: model.description }) : label;
}

function describeModel(model: FrameModel, t: ServicesTranslator): string {
  const label = t(`frameModels.${model.type}`);
  return model.type === 'custom' ? t('summary.labelWithDescription', { label, description: model.description }) : label;
}

function describeDisplayName(name: FrameDisplayName): string {
  return name.type === 'account' ? name.name : name.names;
}

function describeAddon(a: AddonAssignment, t: ServicesTranslator): string {
  switch (a.addon) {
    case 'other':
      return t('summary.labelWithDetail', { label: t('addons.other'), detail: a.mention });
    case 'customNoMention':
      return a.details
        ? t('summary.labelWithDetail', { label: t('addons.customNoMention'), detail: a.details })
        : t('addons.customNoMention');
    default:
      return 'model' in a && a.model
        ? t('summary.labelWithModel', { label: t(`addons.${a.addon}`), model: describeModel(a.model, t) })
        : t(`addons.${a.addon}`);
  }
}

function describeTargets(a: UnitTargets, frameNumbers: Map<string, number>, t: ServicesTranslator): string {
  const targets = a.frameUids.map((uid) => t('summary.frame', { number: frameNumbers.get(uid) ?? '?' }));
  if (a.onSiteCount > 0) {
    targets.push(a.onSiteCount > 1 ? t('summary.onSiteCount', { count: a.onSiteCount }) : t('summary.onSite'));
  }
  return targets.join(', ');
}

/** '13:30' → '13 h 30' (fr) / '13:30' (en) */
function formatTime(time: string, t: ServicesTranslator): string {
  const [hours, minutes] = time.split(':');
  return t('summary.time', { hours, minutes });
}

/* ---------- Composant ---------- */

export function InstallationSummary({ details }: { details: InstallationDetails }) {
  const { placement, frames, kits, addons, openHouse, keybox, flags, directionals, otherNeeds } = details;
  const t = useTranslations('services');
  const formatter = useFormatter();
  const locale = useAppLocale();
  /** '2026-10-24' → 'samedi 24 octobre 2026' */
  const formatDate = (iso: string) => formatIsoDay(iso, locale);
  // uid → numéro affiché (Pancarte 1, 2, 3)
  const frameNumbers = new Map(frames?.units.map((u, i) => [u.uid, i + 1]) ?? []);

  const notSpecified = t('common.notSpecified');

  return (
    <div className={styles.installation}>
      <Fields>
        <Field label={t('summary.placement')} wide>
          <Pill>{describePlacement(placement, t)}</Pill>
        </Field>
      </Fields>

      {frames && (
        <SubSection title={t('summary.frames', { count: frames.units.length })} note={t('summary.kitIncluded')}>
          <UnitGrid>
            {frames.units.map((unit, i) => (
              <UnitCard key={unit.uid} title={t('summary.frame', { number: i + 1 })}>
                {(unit.model || unit.displayName) && (
                  <UnitRows>
                    {unit.model && <UnitRow label={t('summary.model')}>{describeModel(unit.model, t)}</UnitRow>}
                    {unit.displayName && (
                      <UnitRow label={t('summary.displayName')}>{describeDisplayName(unit.displayName)}</UnitRow>
                    )}
                  </UnitRows>
                )}
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {kits && (
        <SubSection title={t('summary.kits', { count: kits.units.length })}>
          <UnitGrid>
            {kits.units.map((kit, i) => (
              <UnitCard key={kit.uid} title={t('summary.kit', { number: i + 1 })}>
                <UnitRows>
                  <UnitRow label={t('summary.model')}>{describeKitModel(kit.model, t)}</UnitRow>
                </UnitRows>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {addons && (
        <SubSection title={t('summary.addons')}>
          <UnitGrid>
            {addons.map((a) => (
              <UnitCard key={a.addon} title={`${describeAddon(a, t)} ×${a.quantity}`}>
                <p className={styles.muted}>{describeTargets(a, frameNumbers, t)}</p>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {openHouse && (
        <Panel title={t('summary.openHouse')}>
          <Fields>
            <Field label={t('summary.dates', { count: openHouse.dates.length })}>
              {formatter.list(openHouse.dates.map(formatDate))}
            </Field>
            <Field label={t('summary.hours')}>
              {t('summary.timeRange', { start: formatTime(openHouse.startTime, t), end: formatTime(openHouse.endTime, t) })}
            </Field>
            <Field label={t('summary.signs', { count: openHouse.quantity })}>
              {describeTargets(openHouse, frameNumbers, t)}
            </Field>
            {openHouse.directionals.length > 0 && (
              <Field label={t('summary.directionals', { count: openHouse.directionals.length })}>
                <ol className={styles.inlineList}>
                  {openHouse.directionals.map((d) => (
                    <li key={d.uid}><TextOrEmpty value={d.placement} emptyLabel={notSpecified} /></li>
                  ))}
                </ol>
              </Field>
            )}
            {openHouse.flagCount > 0 && <Field label={t('summary.flags')}>{openHouse.flagCount}</Field>}
            <Field label={t('summary.removeNextMonday')}>
              {openHouse.removeNextMonday ? (
                <>
                  <Pill tone="success">{t('common.yes')}</Pill>{' '}
                  {formatDate(removalDayAfter(openHouse.dates) ?? openHouse.dates[0])}
                </>
              ) : (
                t('common.no')
              )}
            </Field>
          </Fields>
        </Panel>
      )}

      {keybox && (
        <SubSection title={t('summary.keybox')}>
          <Fields>
            <Field label={t('summary.code')}>{keybox.code}</Field>
            <Field label={t('summary.placement')}>
              <TextOrEmpty value={keybox.placement} emptyLabel={notSpecified} />
            </Field>
          </Fields>
        </SubSection>
      )}

      {flags && (
        <SubSection title={t('summary.flags')}>
          <Fields>
            <Field label={t('summary.mention')}>
              {flags.mention === 'other'
                ? t('summary.labelWithDetail', { label: t('mentions.other'), detail: flags.customMention })
                : t(`mentions.${flags.mention}`)}
            </Field>
            <Field label={t('summary.quantity')}>{flags.quantity}</Field>
          </Fields>
        </SubSection>
      )}

      {directionals && (
        <SubSection
          title={t('summary.directionals', { count: directionals.units.length })}
          note={t(`mentions.${directionals.mention}`)}
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

      {otherNeeds && (
        <SubSection title={t('summary.otherNeeds')}>
          <Prose>{otherNeeds}</Prose>
        </SubSection>
      )}
    </div>
  );
}
