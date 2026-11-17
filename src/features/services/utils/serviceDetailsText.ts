import type { ServiceType } from '@prisma/client';
import type { Locale } from '@/shared/constants/locales';
import type { InstallationDetails } from '../types/installation';
import type { RemovalDetails } from '../types/removal';
import type { CorrectionDetails } from '../types/correction';
import type { PickupDetails } from '../types/pickup';
import type { DeliveryDetails } from '../types/delivery';
import { parseServiceDetails } from '../schemas/serviceDetails.schema';
import { describePlacement, type ServicesTranslator } from './placement';
import {
  describeAddon, describeDisplayName, describeKitModel, describeModel, describePlacements, describeTargets, formatTime,
} from './installationText';
import { describeLargeFormatServiceTranslated } from './largeFormatTranslatedText';
import { removalDayAfter } from './time';
import { formatIsoDay } from './formatDay';

/*
 * Détail complet d'un service en texte (courriel), dans la langue du traducteur.
 * Même contenu que les résumés du formulaire (servicesSummary/*), une ligne par information :
 * sous-titres au premier niveau, unités et champs indentés.
 */

const INDENT = '  ';

interface TextContext {
  t: ServicesTranslator;
  locale: Locale;
  /** « Libellé : valeur » ; l'espace avant le deux-points dépend de la langue */
  pair: (label: string, value: string | number) => string;
  /** Valeur, ou « Non précisé » si vide */
  orEmpty: (value: string | null | undefined) => string;
  yesNo: (value: boolean) => string;
}

const indent = (lines: string[], depth = 1) => lines.map((line) => `${INDENT.repeat(depth)}${line}`);

/** Titre de sous-section, suivi de ses lignes indentées */
const block = (title: string, lines: string[]) => [title, ...indent(lines)];

function installationText({ pickupAddress, frames, kits, addons, openHouse, keybox, flags, directionals, otherNeeds }: InstallationDetails, c: TextContext): string[] {
  const { t, pair, orEmpty } = c;
  const frameNumbers = new Map(frames?.units.map((u, i) => [u.uid, i + 1]) ?? []);
  const formatDate = (iso: string) => formatIsoDay(iso, c.locale);
  const list = (items: string[]) => new Intl.ListFormat(`${c.locale}-CA`, { type: 'conjunction' }).format(items);
  const lines: string[] = [];

  // Invités : matériel à aller chercher à une autre adresse (null : non requis, ou membre)
  if (pickupAddress) lines.push(...block(t('summary.materialPickup'), [pair(t('summary.pickupAddress'), pickupAddress)]));

  if (frames) {
    lines.push(
      ...block(
        `${t('summary.frames', { count: frames.units.length })} — ${t('summary.kitIncluded')}`,
        frames.units.flatMap((unit, i) =>
          block(t('summary.frame', { number: i + 1 }), [
            ...(unit.model ? [pair(t('summary.model'), describeModel(unit.model, t))] : []),
            ...(unit.displayName ? [pair(t('summary.displayName'), describeDisplayName(unit.displayName))] : []),
            pair(t('summary.placement'), describePlacement(unit.placement, t)),
          ]),
        ),
      ),
    );
  }

  if (kits) {
    lines.push(
      ...block(
        t('summary.kits', { count: kits.units.length }),
        kits.units.flatMap((kit, i) =>
          block(t('summary.kit', { number: i + 1 }), [
            pair(t('summary.model'), describeKitModel(kit.model, t)),
            pair(t('summary.placement'), describePlacement(kit.placement, t)),
          ]),
        ),
      ),
    );
  }

  if (addons) {
    lines.push(
      ...block(
        t('summary.addons'),
        addons.flatMap((a) =>
          block(`${describeAddon(a, t)} ×${a.quantity}`, [
            describeTargets(a, frameNumbers, t),
            // Sans pancarte commandée : emplacements propres à l'ajout
            ...(a.placements ? [pair(t('summary.placement'), describePlacements(a.placements, t))] : []),
          ]),
        ),
      ),
    );
  }

  if (openHouse) {
    lines.push(
      ...block(t('summary.openHouse'), [
        pair(t('summary.dates', { count: openHouse.dates.length }), list(openHouse.dates.map(formatDate))),
        pair(
          t('summary.hours'),
          t('summary.timeRange', { start: formatTime(openHouse.startTime, t), end: formatTime(openHouse.endTime, t) }),
        ),
        pair(t('summary.signs', { count: openHouse.quantity }), describeTargets(openHouse, frameNumbers, t)),
        ...(openHouse.placements ? [pair(t('summary.placement'), describePlacements(openHouse.placements, t))] : []),
        ...(openHouse.directionals.length > 0
          ? block(
              t('summary.directionals', { count: openHouse.directionals.length }),
              openHouse.directionals.map((d, i) => `${i + 1}. ${orEmpty(d.placement)}`),
            )
          : []),
        ...(openHouse.flagCount > 0 ? [pair(t('summary.flags'), openHouse.flagCount)] : []),
        pair(
          t('summary.removeNextMonday'),
          openHouse.removeNextMonday
            ? t('summary.yesWithDate', { date: formatDate(removalDayAfter(openHouse.dates) ?? openHouse.dates[0]) })
            : t('common.no'),
        ),
      ]),
    );
  }

  if (keybox) {
    lines.push(
      ...block(t('summary.keybox'), [
        pair(t('summary.code'), keybox.code),
        pair(t('summary.placement'), orEmpty(keybox.placement)),
      ]),
    );
  }

  if (flags) {
    lines.push(
      ...block(t('summary.flags'), [
        pair(
          t('summary.mention'),
          flags.mention === 'other'
            ? t('summary.labelWithDetail', { label: t('mentions.other'), detail: flags.customMention })
            : t(`mentions.${flags.mention}`),
        ),
        pair(t('summary.quantity'), flags.quantity),
        pair(t('summary.placement'), orEmpty(flags.placement)),
      ]),
    );
  }

  if (directionals) {
    lines.push(
      ...block(
        `${t('summary.directionals', { count: directionals.units.length })} — ${t(`mentions.${directionals.mention}`)}`,
        directionals.units.map((u, i) => pair(t('summary.directional', { number: i + 1 }), orEmpty(u.placement))),
      ),
    );
  }

  if (otherNeeds) lines.push(...block(t('summary.otherNeeds'), [otherNeeds]));
  return lines;
}

function removalText({ afterRemoval, frames, addons, keybox, flags, directionals, otherDetails }: RemovalDetails, c: TextContext): string[] {
  const { t, pair, orEmpty } = c;
  const lines: string[] = [];

  // Invités : que faire du matériel retiré (null pour un membre ou un ancien retrait)
  if (afterRemoval) {
    lines.push(
      ...block(t('summary.afterRemoval'), [
        pair(t('summary.afterRemovalChoice'), t(`removal.afterRemoval.choices.${afterRemoval.choice}`)),
        ...(afterRemoval.choice === 'deliver' ? [pair(t('summary.deliveryAddress'), afterRemoval.address)] : []),
        ...(afterRemoval.choice !== 'storage' && afterRemoval.dropOff ? [pair(t('summary.dropOff'), afterRemoval.dropOff)] : []),
      ]),
    );
  }

  if (frames) {
    lines.push(
      ...block(
        `${t('summary.framesToRemove', { count: frames.units.length })} — ${t('summary.addonsIncluded')}`,
        frames.units.map((u, i) => pair(t('summary.frame', { number: i + 1 }), describePlacement(u.placement, t))),
      ),
    );
  }

  if (addons) {
    lines.push(
      ...block(t('summary.addonsToRemove', { count: addons.units.length }), [
        ...(addons.details ? [addons.details] : []),
        ...addons.units.map((u, i) => pair(t('summary.addon', { number: i + 1 }), describePlacement(u.placement, t))),
      ]),
    );
  }

  if (keybox) {
    lines.push(
      ...block(t('summary.keyboxesToRemove', { count: keybox.quantity }), [
        pair(t('summary.code'), keybox.code),
        pair(t('summary.placement'), orEmpty(keybox.placement)),
      ]),
    );
  }

  if (flags) {
    lines.push(
      ...block(t('summary.flagsToRemove', { count: flags.quantity }), [
        pair(
          t('summary.mention'),
          flags.mention === 'other'
            ? t('summary.labelWithDetail', { label: t('mentions.other'), detail: flags.customMention })
            : flags.mention
              ? t(`mentions.${flags.mention}`)
              : orEmpty(null),
        ),
        pair(t('summary.placement'), orEmpty(flags.placement)),
      ]),
    );
  }

  if (directionals) {
    // Retraits enregistrés avant la question de la mention : pas de mention
    const mention = directionals.mention ? ` — ${t(`mentions.${directionals.mention}`)}` : '';
    lines.push(
      ...block(
        `${t('summary.directionalsToRemove', { count: directionals.units.length })}${mention}`,
        directionals.units.map((u, i) => pair(t('summary.directional', { number: i + 1 }), orEmpty(u.placement))),
      ),
    );
  }

  if (otherDetails) lines.push(...block(t('summary.specialRemoval'), [otherDetails]));
  return lines;
}

function correctionText(details: CorrectionDetails, c: TextContext): string[] {
  const { t, pair } = c;
  return [
    pair(t('summary.type'), t(`correction.kinds.${details.kind}`)),
    ...(details.kind === 'explain' ? [details.explanation] : []),
  ];
}

function pickupText(details: PickupDetails, c: TextContext): string[] {
  const { t, pair, yesNo } = c;
  return [
    pair(t('summary.toPickup'), details.materials.map((m) => t(`pickup.materials.${m}`)).join(', ')),
    pair(t('summary.newModels'), yesNo(details.newModels)),
    ...(details.details ? [details.details] : []),
  ];
}

function deliveryText({ frames, addons, keybox, directionals, others }: DeliveryDetails, c: TextContext): string[] {
  const { t, pair, orEmpty, yesNo } = c;
  /** Modèle fixe, ou « Modèle particulier : description » */
  const modelLabel = (label: string, description?: string) =>
    description ? t('summary.labelWithDescription', { label, description }) : label;
  const lines: string[] = [];

  if (frames) {
    lines.push(
      ...block(
        t('summary.deliveryFrames', { count: frames.length }),
        frames.flatMap((f, i) =>
          block(t('summary.modelNumber', { number: i + 1 }), [
            pair(t('summary.model'), modelLabel(t(`frameModels.${f.model}`), f.model === 'custom' ? f.description : undefined)),
            pair(t('summary.quantity'), f.quantity),
            pair(t('summary.withAnchorsAndPoles'), yesNo(f.withAnchorsAndPoles)),
          ]),
        ),
      ),
    );
  }

  if (addons) {
    lines.push(
      ...block(
        t('summary.deliveryAddons', { count: addons.length }),
        addons.map((a) => {
          const label = t(`delivery.addons.${a.addon}`);
          const title =
            a.addon === 'other' ? t('summary.labelWithDetail', { label, detail: a.mention })
            : a.addon === 'customNoMention' && a.model ? t('summary.labelWithModel', { label, model: a.model })
            : label;
          return `${title} ×${a.quantity}`;
        }),
      ),
    );
  }

  if (keybox) {
    lines.push(
      ...block(t('summary.deliveryKeyboxes'), [
        pair(t('summary.quantity'), keybox.quantity),
        pair(t('summary.combination'), orEmpty(keybox.code)),
      ]),
    );
  }

  if (directionals) {
    lines.push(
      ...block(
        t('summary.deliveryDirectionals', { count: directionals.length }),
        directionals.flatMap((d, i) =>
          block(t('summary.modelNumber', { number: i + 1 }), [
            pair(
              t('summary.model'),
              modelLabel(t(`delivery.directionalModels.${d.model}`), d.model === 'custom' ? d.description : undefined),
            ),
            pair(t('summary.quantity'), d.quantity),
            pair(t('summary.withPoles'), yesNo(d.withPoles)),
          ]),
        ),
      ),
    );
  }

  if (others) {
    lines.push(
      ...block(
        t('summary.deliveryOthers', { count: others.length }),
        others.map((o) => `${o.description} ×${o.quantity}`),
      ),
    );
  }
  return lines;
}

/**
 * Lignes de détail d'un service enregistré (Service.details), sans son titre.
 * null si les détails sont illisibles : à signaler plutôt qu'à masquer.
 */
export function describeServiceDetailsText(
  type: ServiceType,
  details: unknown,
  t: ServicesTranslator,
  locale: Locale,
): string[] | null {
  const parsed = parseServiceDetails(type, details);
  if (!parsed) return null;

  const colon = locale === 'fr' ? ' : ' : ': ';
  const notSpecified = t('common.notSpecified');
  const c: TextContext = {
    t,
    locale,
    pair: (label, value) => `${label}${colon}${value}`,
    orEmpty: (value) => value || notSpecified,
    yesNo: (value) => t(value ? 'common.yes' : 'common.no'),
  };

  switch (parsed.kind) {
    case 'installation':
      return installationText(parsed.details, c);
    case 'removal':
      return removalText(parsed.details, c);
    case 'correction':
      return correctionText(parsed.details, c);
    case 'pickup':
      return pickupText(parsed.details, c);
    case 'delivery':
      return deliveryText(parsed.details, c);
    case 'largeFormat':
      return describeLargeFormatServiceTranslated(parsed.details, t);
  }
}
