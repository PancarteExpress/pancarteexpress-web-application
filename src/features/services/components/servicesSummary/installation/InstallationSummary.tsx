import { useFormatter, useTranslations } from 'next-intl';
import type {
  AddonAssignment, FrameDisplayName, FrameModel, InstallationDetails, KitModel, UnitTargets,
} from '@/features/services/types/installation';
import { describePlacement, type ServicesTranslator } from '@/features/services/utils/placement';
import { removalDayAfter } from '@/features/services/utils/time';
import { formatIsoDay } from '@/features/services/utils/formatDay';
import { useAppLocale } from '@/shared/hooks/useAppLocale';
import styles from '../servicesSummary.module.css';

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

  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>{t('summary.placement')}</dt>
        <dd>{describePlacement(placement, t)}</dd>
      </dl>
      {frames && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.frames', { count: frames.units.length })}</h4>
          <p className={styles.muted}>{t('summary.kitIncluded')}</p>

          {frames.units.map((unit, i) => (
            <dl key={unit.uid} className={styles.unit}>
              <dt className={styles.unitTitle}>{t('summary.frame', { number: i + 1 })}</dt>
              <dd>
                <dl className={styles.list}>
                  {unit.model && (
                    <>
                      <dt>{t('summary.model')}</dt>
                      <dd>{describeModel(unit.model, t)}</dd>
                    </>
                  )}
                  {unit.displayName && (
                    <>
                      <dt>{t('summary.displayName')}</dt>
                      <dd>{describeDisplayName(unit.displayName)}</dd>
                    </>
                  )}
                </dl>
              </dd>
            </dl>
          ))}
        </section>
      )}

      {kits && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.kits', { count: kits.units.length })}</h4>
          <dl className={styles.list}>
            {kits.units.map((kit, i) => (
              <div key={kit.uid} className={styles.row}>
                <dt>{t('summary.kit', { number: i + 1 })}</dt>
                <dd>{describeKitModel(kit.model, t)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {addons && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.addons')}</h4>
          <dl className={styles.list}>
            {addons.map((a) => (
              <div key={a.addon} className={styles.row}>
                <dt>{describeAddon(a, t)} ×{a.quantity}</dt>
                <dd>{describeTargets(a, frameNumbers, t)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {openHouse && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.openHouse')}</h4>
          <dl className={styles.list}>
            <dt>{t('summary.dates', { count: openHouse.dates.length })}</dt>
            <dd>{formatter.list(openHouse.dates.map(formatDate))}</dd>

            <dt>{t('summary.hours')}</dt>
            <dd>{t('summary.timeRange', { start: formatTime(openHouse.startTime, t), end: formatTime(openHouse.endTime, t) })}</dd>

            <dt>{t('summary.signs', { count: openHouse.quantity })}</dt>
            <dd>{describeTargets(openHouse, frameNumbers, t)}</dd>

            {openHouse.directionals.length > 0 && (
              <>
                <dt>{t('summary.directionals', { count: openHouse.directionals.length })}</dt>
                <dd>
                  <ol className={styles.inlineList}>
                    {openHouse.directionals.map((d) => <li key={d.uid}>{d.placement || t('common.notSpecified')}</li>)}
                  </ol>
                </dd>
              </>
            )}

            {openHouse.flagCount > 0 && (
              <>
                <dt>{t('summary.flags')}</dt>
                <dd>{openHouse.flagCount}</dd>
              </>
            )}

            <dt>{t('summary.removeNextMonday')}</dt>
            <dd>
              {openHouse.removeNextMonday
                ? t('summary.yesWithDate', { date: formatDate(removalDayAfter(openHouse.dates) ?? openHouse.dates[0]) })
                : t('common.no')}
            </dd>
          </dl>
        </section>
      )}

      {keybox && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.keybox')}</h4>
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
          <h4 className={styles.subtitle}>{t('summary.flags')}</h4>
          <dl className={styles.list}>
            <dt>{t('summary.mention')}</dt>
            <dd>
              {flags.mention === 'other'
                ? t('summary.labelWithDetail', { label: t('mentions.other'), detail: flags.customMention })
                : t(`mentions.${flags.mention}`)}
            </dd>
            <dt>{t('summary.quantity')}</dt>
            <dd>{flags.quantity}</dd>
          </dl>
        </section>
      )}

      {directionals && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.directionals', { count: directionals.units.length })}</h4>
          <dl className={styles.list}>
            <dt>{t('summary.mention')}</dt>
            <dd>{t(`mentions.${directionals.mention}`)}</dd>
            {directionals.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>{t('summary.directional', { number: i + 1 })}</dt>
                <dd>{u.placement || t('common.notSpecified')}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {otherNeeds && (
        <section>
          <h4 className={styles.subtitle}>{t('summary.otherNeeds')}</h4>
          <p className={styles.prose}>{otherNeeds}</p>
        </section>
      )}
    </div>
  );
}