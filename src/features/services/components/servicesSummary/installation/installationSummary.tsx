import { format, parse } from 'date-fns';
import { frCA } from 'date-fns/locale';
import {
  ADDON_LABELS, FRAME_MODEL_LABELS, KIT_MODEL_LABELS, LADDER_LABELS, LOCATION_LABELS, MOUNTING_LABELS,
  FLAG_MENTION_LABELS, SIGN_MENTION_LABELS, WINDOW_SIDE_LABELS,
} from '@/features/services/constants/installation';
import type {
  AddonAssignment, FrameDisplayName, FrameModel, InstallationDetails, KitModel, Placement, PlacementAccess,
  UnitTargets,
} from '@/features/services/types/installation';
import styles from '../servicesSummary.module.css';

/* ---------- Formatage (fonctions pures) ---------- */

function describeKitModel(model: KitModel): string {
  const label = KIT_MODEL_LABELS[model.type];
  return model.type === 'custom' ? `${label} : ${model.description}` : label;
}

function describeModel(model: FrameModel): string {
  const label = FRAME_MODEL_LABELS[model.type];
  return model.type === 'custom' ? `${label} : ${model.description}` : label;
}

function describeDisplayName(name: FrameDisplayName): string {
  return name.type === 'account' ? name.name : name.names;
}

function describeAccess(a: PlacementAccess): string {
  switch (a.type) {
    case 'ladder':
      return LADDER_LABELS[a.ladder];
    case 'phoneAppointment':
      return `Rendez-vous téléphonique : ${a.contact}`;
    case 'keybox':
      return `Boîte à clés : ${a.info}`;
  }
}

export function describePlacement(p: Placement): string {
  const location = LOCATION_LABELS[p.location];
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return location;
    case 'wall':
      return `${location} — ${LADDER_LABELS[p.ladder]}, ${MOUNTING_LABELS[p.mounting]}`;
    case 'balcony':
      return `${location} — ${describeAccess(p.access)}`;
    case 'window':
      return `${location} (${WINDOW_SIDE_LABELS[p.side].toLowerCase()}) — ${describeAccess(p.access)}`;
    case 'other':
      return `${location} — ${p.description}`;
  }
}

function describeAddon(a: AddonAssignment): string {
  switch (a.addon) {
    case 'other':
      return `${ADDON_LABELS.other} : « ${a.mention} »`;
    case 'customNoMention':
      return a.details ? `${ADDON_LABELS.customNoMention} : « ${a.details} »` : ADDON_LABELS.customNoMention;
    default:
      return ADDON_LABELS[a.addon];
  }
}

function describeTargets(a: UnitTargets, frameNumbers: Map<string, number>): string {
  const targets = a.frameUids.map((uid) => `Pancarte ${frameNumbers.get(uid) ?? '?'}`);
  if (a.onSiteCount > 0) {
    targets.push(a.onSiteCount > 1 ? `Sur place ×${a.onSiteCount}` : 'Sur place');
  }
  return targets.join(', ');
}

/** '2026-10-24' → 'samedi 24 octobre 2026' */
function formatDate(iso: string): string {
  return format(parse(iso, 'yyyy-MM-dd', new Date()), 'EEEE d MMMM yyyy', { locale: frCA });
}

/** '13:30' → '13 h 30' */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours} h ${minutes}`;
}

/* ---------- Composant ---------- */

export function InstallationSummary({ details }: { details: InstallationDetails }) {
  const { placement, frames, kits, addons, openHouse, keybox, flags, directionals, otherNeeds } = details;
  // uid → numéro affiché (Pancarte 1, 2, 3)
  const frameNumbers = new Map(frames?.units.map((u, i) => [u.uid, i + 1]) ?? []);

  return (
    <div className={styles.installation}>
      <dl className={styles.list}>
        <dt>Emplacement</dt>
        <dd>{describePlacement(placement)}</dd>
      </dl>
      {frames && (
        <section>
          <h4 className={styles.subtitle}>Pancartes ({frames.units.length})</h4>
          <p className={styles.muted}>Kit (ancrage et poteau) inclus</p>

          {frames.units.map((unit, i) => (
            <dl key={unit.uid} className={styles.unit}>
              <dt className={styles.unitTitle}>Pancarte {i + 1}</dt>
              <dd>
                <dl className={styles.list}>
                  {unit.model && (
                    <>
                      <dt>Modèle</dt>
                      <dd>{describeModel(unit.model)}</dd>
                    </>
                  )}
                  {unit.displayName && (
                    <>
                      <dt>Nom affiché</dt>
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
          <h4 className={styles.subtitle}>Kits ({kits.units.length})</h4>
          <dl className={styles.list}>
            {kits.units.map((kit, i) => (
              <div key={kit.uid} className={styles.row}>
                <dt>Kit {i + 1}</dt>
                <dd>{describeKitModel(kit.model)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {addons && (
        <section>
          <h4 className={styles.subtitle}>Ajouts</h4>
          <dl className={styles.list}>
            {addons.map((a) => (
              <div key={a.addon} className={styles.row}>
                <dt>{describeAddon(a)} ×{a.quantity}</dt>
                <dd>{describeTargets(a, frameNumbers)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {openHouse && (
        <section>
          <h4 className={styles.subtitle}>Visite libre</h4>
          <dl className={styles.list}>
            <dt>{openHouse.dates.length > 1 ? 'Dates' : 'Date'}</dt>
            <dd>{openHouse.dates.map(formatDate).join(' et ')}</dd>

            <dt>Heures</dt>
            <dd>{formatTime(openHouse.startTime)} à {formatTime(openHouse.endTime)}</dd>

            <dt>Affichettes ×{openHouse.quantity}</dt>
            <dd>{describeTargets(openHouse, frameNumbers)}</dd>

            {openHouse.directionals.length > 0 && (
              <>
                <dt>Directionnelles ({openHouse.directionals.length})</dt>
                <dd>
                  <ol className={styles.inlineList}>
                    {openHouse.directionals.map((d) => <li key={d.uid}>{d.placement || 'Non précisé'}</li>)}
                  </ol>
                </dd>
              </>
            )}

            {openHouse.flagCount > 0 && (
              <>
                <dt>Drapeaux</dt>
                <dd>{openHouse.flagCount}</dd>
              </>
            )}

            <dt>Retrait le lundi suivant</dt>
            <dd>{openHouse.removeNextMonday ? 'Oui' : 'Non'}</dd>
          </dl>
        </section>
      )}

      {keybox && (
        <section>
          <h4 className={styles.subtitle}>Boîte à clés</h4>
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
          <h4 className={styles.subtitle}>Drapeaux</h4>
          <dl className={styles.list}>
            <dt>Mention</dt>
            <dd>
              {flags.mention === 'other'
                ? `${FLAG_MENTION_LABELS.other} : « ${flags.customMention} »`
                : FLAG_MENTION_LABELS[flags.mention]}
            </dd>
            <dt>Quantité</dt>
            <dd>{flags.quantity}</dd>
          </dl>
        </section>
      )}

      {directionals && (
        <section>
          <h4 className={styles.subtitle}>Directionnelles ({directionals.units.length})</h4>
          <dl className={styles.list}>
            <dt>Mention</dt>
            <dd>{SIGN_MENTION_LABELS[directionals.mention]}</dd>
            {directionals.units.map((u, i) => (
              <div key={u.uid} className={styles.row}>
                <dt>Directionnelle {i + 1}</dt>
                <dd>{u.placement || 'Non précisé'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {otherNeeds && (
        <section>
          <h4 className={styles.subtitle}>Autres besoins</h4>
          <p className={styles.prose}>{otherNeeds}</p>
        </section>
      )}
    </div>
  );
}