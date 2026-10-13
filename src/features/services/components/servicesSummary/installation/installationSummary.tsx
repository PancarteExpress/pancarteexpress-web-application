import {
  ADDON_LABELS, FRAME_MODEL_LABELS, LADDER_LABELS, LOCATION_LABELS, MOUNTING_LABELS,
} from '@/features/services/constants/installation';
import type {
  AddonAssignment, FrameDisplayName, FrameModel, FramePlacement, InstallationDetails,
} from '@/features/services/types/installation';
import styles from '../servicesSummary.module.css';

/* ---------- Formatage (fonctions pures) ---------- */

function describeModel(model: FrameModel): string {
  const label = FRAME_MODEL_LABELS[model.type];
  return model.type === 'custom' ? `${label} : ${model.description}` : label;
}

function describeDisplayName(name: FrameDisplayName): string {
  return name.type === 'account' ? name.name : name.names;
}

function describePlacement(p: FramePlacement): string {
  const location = LOCATION_LABELS[p.location];
  switch (p.location) {
    case 'ground':
    case 'ramp':
      return location;
    case 'wall':
      return `${location} — ${LADDER_LABELS[p.ladder]}, ${MOUNTING_LABELS[p.mounting]}`;
    case 'fence':
    case 'balcony':
      return p.access.type === 'ladder'
        ? `${location} — ${LADDER_LABELS[p.access.ladder]}`
        : `${location} — Rendez-vous téléphonique : ${p.access.contact}`;
    case 'other':
      return `${location} — ${p.description}`;
  }
}

function describeAddon(a: AddonAssignment): string {
  return a.addon === 'other' ? `${ADDON_LABELS.other} : « ${a.mention} »` : ADDON_LABELS[a.addon];
}

function describeTargets(a: AddonAssignment, frameNumbers: Map<string, number>): string {
  const targets = a.frameUids.map((uid) => `Pancarte ${frameNumbers.get(uid) ?? '?'}`);
  if (a.onSiteCount > 0) {
    targets.push(a.onSiteCount > 1 ? `Sur place ×${a.onSiteCount}` : 'Sur place');
  }
  return targets.join(', ');
}

/* ---------- Composant ---------- */

export function InstallationSummary({ details }: { details: InstallationDetails }) {
  const { frames, addons } = details;
  // uid → numéro affiché (Pancarte 1, 2, 3)
  const frameNumbers = new Map(frames?.units.map((u, i) => [u.uid, i + 1]) ?? []);

  return (
    <div className={styles.installation}>
      {frames && (
        <section>
          <h4 className={styles.subtitle}>Pancartes ({frames.units.length})</h4>
          <p className={styles.muted}>Ancrages et poteaux inclus.</p>

          {frames.pickupAddress && (
            <dl className={styles.list}>
              <dt>Ramassage du matériel</dt>
              <dd>{frames.pickupAddress}</dd>
            </dl>
          )}

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
                  <dt>Emplacement</dt>
                  <dd>{describePlacement(unit.placement)}</dd>
                </dl>
              </dd>
            </dl>
          ))}
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
    </div>
  );
}