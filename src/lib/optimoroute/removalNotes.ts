import type { Ladder, Mounting } from '@/features/services/constants/installation';
import type { Placement, PlacementAccess } from '@/features/services/types/installation';
import type { RemovalDetails } from '@/features/services/types/removal';
import { upper } from './installationNotes';

/*
 * Résumé d'un retrait dans les notes OptimoRoute, selon la nomenclature de l'équipe.
 * Ex. : 3x RECUP {COMPTE} [**FENÊTRE AVEC RDV** (coordonnées) / Derrière la haie / Au sol]
 * Sans dépendance serveur : l'aperçu du formulaire et l'envoi réel utilisent le même texte.
 */

const quantityPrefix = (n: number): string => (n > 1 ? `${n}x ` : '');

/** Échelles au retrait : plus court qu'à l'installation (pas de « AVEC », pas de « PI ») */
const REMOVAL_LADDER_LABELS: Record<Ladder, string> = {
  noLadder: 'SANS ÉCHELLE',
  smallLadder: 'ÉCHELLE 6-12',
  bigLadder: 'ÉCHELLE 13-24',
};

const REMOVAL_MOUNTING_LABELS: Record<Mounting, string> = {
  vShapeDrilled: 'EN V',
  flatDoubleTape: 'À PLAT',
};

/** Accès au retrait : le libellé, et le détail entre parenthèses (coordonnées, infos de la boîte) */
function removalAccess(access: PlacementAccess): { label: string; detail: string | null } {
  switch (access.type) {
    case 'phoneAppointment':
      return { label: 'AVEC RDV', detail: access.contact.trim() };
    case 'keybox':
      return { label: 'VIA BAC', detail: access.info.trim() };
    case 'ladder':
      return { label: REMOVAL_LADDER_LABELS[access.ladder], detail: null };
  }
}

/**
 * Emplacement d'un élément à retirer : plus court qu'à l'installation.
 * Fenêtre sans côté, balcon sans fixation, « Autres » tel que saisi, « Au sol » en toutes lettres.
 */
function removalPlacementNote(p: Placement): string {
  switch (p.location) {
    case 'ground':
      return 'Au sol';
    case 'ramp':
      return '**SUR RAMPE**';
    case 'window':
    case 'balcony': {
      const { label, detail } = removalAccess(p.access);
      const place = p.location === 'window' ? 'FENÊTRE' : 'BALCON';
      return `**${place} ${label}**${detail ? ` (${detail})` : ''}`;
    }
    case 'wall':
      return `**MUR ${REMOVAL_MOUNTING_LABELS[p.mounting]} ${REMOVAL_LADDER_LABELS[p.ladder]}**`;
    case 'other':
      return p.description.trim();
  }
}

/** Emplacements particuliers d'abord, dans l'ordre ; « Au sol » à la fin */
const placementsList = (placements: readonly Placement[]): string =>
  [
    ...placements.filter((p) => p.location !== 'ground'),
    ...placements.filter((p) => p.location === 'ground'),
  ]
    .map(removalPlacementNote)
    .join(' / ');

/** Pancartes à retirer : 3x RECUP {COMPTE} [emplacements] */
function framesNote(frames: RemovalDetails['frames'], account: string | null): string | null {
  if (!frames || frames.units.length === 0) return null;
  const name = account ? ` ${upper(account)}` : '';
  return `${quantityPrefix(frames.units.length)}RECUP${name} [${placementsList(frames.units.map((u) => u.placement))}]`;
}

/** Ajouts à retirer : 3x RECUP AJOUT PRÉCIS (précision) {COMPTE} [emplacements] */
function addonsNote(addons: RemovalDetails['addons'], account: string | null): string | null {
  if (!addons || addons.units.length === 0) return null;
  const details = addons.details?.trim();
  const precision = details ? ` PRÉCIS (${details})` : '';
  const name = account ? ` ${upper(account)}` : '';
  return `${quantityPrefix(addons.units.length)}RECUP AJOUT${precision}${name} [${placementsList(addons.units.map((u) => u.placement))}]`;
}

const name = (account: string | null): string => (account ? ` ${upper(account)}` : '');
const typed = (text: string): string => (text.trim() ? ` (${text.trim()})` : '');

/** Boîtes à clés à retirer : 2x BAC{CODE} {COMPTE} ({emplacement}), sans « RECUP » */
function keyboxNote(keybox: RemovalDetails['keybox'], account: string | null): string | null {
  if (!keybox) return null;
  return `${quantityPrefix(keybox.quantity)}BAC${keybox.code}${name(account)}${typed(keybox.placement)}`;
}

const FLAG_MENTION_LABELS = { forSale: 'À VENDRE', sold: 'VENDU' } as const;
const SIGN_MENTION_LABELS = { forSale: 'À VENDRE', sold: 'VENDU', forRent: 'À LOUER' } as const;

/** Drapeaux à retirer : 2x RECUP DRAPEAU {MENTION} {COMPTE} ({emplacement}) ; mention absente (anciens retraits) omise */
function flagsNote(flags: RemovalDetails['flags'], account: string | null): string | null {
  if (!flags) return null;
  const mention =
    flags.mention === 'other' ? ` ${upper(flags.customMention)}`
    : flags.mention ? ` ${FLAG_MENTION_LABELS[flags.mention]}`
    : '';
  return `${quantityPrefix(flags.quantity)}RECUP DRAPEAU${mention}${name(account)}${typed(flags.placement)}`;
}

/** Directionnelles à retirer : 3x RECUP DIRECTIONNELLES {MENTION} {COMPTE} [emplacements ; vide → « ... »] */
function directionalsNote(directionals: RemovalDetails['directionals'], account: string | null): string | null {
  if (!directionals || directionals.units.length === 0) return null;
  const count = directionals.units.length;
  const mention = directionals.mention ? ` ${SIGN_MENTION_LABELS[directionals.mention]}` : '';
  const places = directionals.units.map((u) => u.placement.trim());
  const list = places.some(Boolean) ? ` [${places.map((p) => p || '...').join(' / ')}]` : '';
  return `${quantityPrefix(count)}RECUP ${count > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE'}${mention}${name(account)}${list}`;
}

/** Autres : RECUP MATÉRIEL {TEXTE} {COMPTE} */
const otherNote = (otherDetails: string | null, account: string | null): string | null =>
  otherDetails?.trim() ? `RECUP MATÉRIEL ${upper(otherDetails)}${name(account)}` : null;

/**
 * Résumé du retrait : pancartes, ajouts, boîtes à clés, drapeaux, directionnelles, autres.
 * Le nom du compte n'apparaît qu'une fois, sur le premier élément. Si rien n'est couvert, « RECUP ».
 */
export function buildRemovalNotes(details: RemovalDetails, accountName: string | null): string {
  const parts: string[] = [];
  let account = accountName;
  for (const build of [
    (a: string | null) => framesNote(details.frames, a),
    (a: string | null) => addonsNote(details.addons, a),
    (a: string | null) => keyboxNote(details.keybox, a),
    (a: string | null) => flagsNote(details.flags, a),
    (a: string | null) => directionalsNote(details.directionals, a),
    (a: string | null) => otherNote(details.otherDetails, a),
  ]) {
    const note = build(account);
    if (note) {
      parts.push(note);
      account = null;
    }
  }
  return parts.length > 0 ? parts.join(' + ') : 'RECUP';
}
