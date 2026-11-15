import type {
  AddonAssignment, FrameDisplayName, FrameModel, KitModel, Placement, UnitTargets,
} from '@/features/services/types/installation';
import { describePlacement, type ServicesTranslator } from './placement';

/*
 * Textes d'une installation, dans la langue du traducteur (namespace « services »).
 * Partagés par le résumé du formulaire (InstallationSummary) et le courriel interne par numéro PE.
 */

export function describeKitModel(model: KitModel, t: ServicesTranslator): string {
  const label = t(`kitModels.${model.type}`);
  return model.type === 'custom' ? t('summary.labelWithDescription', { label, description: model.description }) : label;
}

export function describeModel(model: FrameModel, t: ServicesTranslator): string {
  const label = t(`frameModels.${model.type}`);
  return model.type === 'custom' ? t('summary.labelWithDescription', { label, description: model.description }) : label;
}

export function describeDisplayName(name: FrameDisplayName): string {
  return name.type === 'account' ? name.name : name.names;
}

export function describeAddon(a: AddonAssignment, t: ServicesTranslator): string {
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

export function describeTargets(a: UnitTargets, frameNumbers: Map<string, number>, t: ServicesTranslator): string {
  const targets = a.frameUids.map((uid) => t('summary.frame', { number: frameNumbers.get(uid) ?? '?' }));
  if (a.onSiteCount > 0) {
    targets.push(a.onSiteCount > 1 ? t('summary.onSiteCount', { count: a.onSiteCount }) : t('summary.onSite'));
  }
  return targets.join(', ');
}

/** Emplacements propres (sans pancarte) : un seul = tous au même endroit */
export function describePlacements(placements: Placement[], t: ServicesTranslator): string {
  return placements.map((p) => describePlacement(p, t)).join(' · ');
}

/** '13:30' → '13 h 30' (fr) / '13:30' (en) */
export function formatTime(time: string, t: ServicesTranslator): string {
  const [hours, minutes] = time.split(':');
  return t('summary.time', { hours, minutes });
}
