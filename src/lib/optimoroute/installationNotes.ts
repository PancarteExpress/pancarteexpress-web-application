import { format } from 'date-fns';
import { frCA } from 'date-fns/locale';
import type { Addon, KitModelType, Ladder, Mounting } from '@/features/services/constants/installation';
import type {
  AddonAssignment, FrameModel, FrameUnit, InstallationDetails, KitUnit, Placement, PlacementAccess, UnitTargets,
} from '@/features/services/types/installation';

/*
 * Résumé d'une installation dans les notes OptimoRoute, selon la nomenclature de l'équipe.
 * Ex. : KIT STEPHANY (NATASHA FOURNIER) **PRESTIGE** + AJOUT À VENDRE **SUR RAMPE** + BAC1234 (SUR LA RAMPE)
 * Sans dépendance serveur : l'aperçu du formulaire et l'envoi réel utilisent le même texte.
 */

export const upper = (text: string): string => text.trim().toLocaleUpperCase('fr-CA');

const ADDON_NOTE_LABELS: Record<Addon, string> = {
  forSale: 'À VENDRE',
  customNoMention: 'PERSO',
  duplex: 'DUPLEX',
  land: 'TERRAIN',
  sold: 'VENDU',
  groundFloor: 'REZ-DE-CHAUSSÉE',
  triplex: 'TRIPLEX',
  waterfront: "BORD DE L'EAU",
  forRent: 'À LOUER',
  secondFloor: '2e ÉTAGE',
  quadruplex: 'QUADRUPLEX',
  condo: 'CONDO',
  rented: 'LOUÉ',
  thirdFloor: '3e ÉTAGE',
  plex: 'PLEX',
  other: 'AUTRES',
};

const SIGN_MENTION_NOTE_LABELS = { forSale: 'À VENDRE', sold: 'VENDU', forRent: 'À LOUER' } as const;

const LADDER_NOTE_LABELS: Record<Ladder, string> = {
  noLadder: '',
  smallLadder: ' AVEC ÉCHELLE 6-12 PI',
  bigLadder: ' AVEC ÉCHELLE 13-24 PI',
};

const KIT_MODEL_NOTE_LABELS: Record<KitModelType, string> = {
  shortPost36: '36"',
  longPost48: '48"',
  colonialWhite: 'COLONIAL BLANC',
  colonialBlack: 'COLONIAL NOIR',
  aluminumWhite: 'ALUMINIUM BLANC',
  aluminumBlack: 'ALUMINIUM NOIR',
  aluminumEngelVolkers: 'ALUMINIUM ENGEL & VÖLKERS',
  custom: 'SPÉCIFIQUE',
};

const MOUNTING_NOTE_LABELS: Record<Mounting, string> = {
  vShapeDrilled: 'EN V',
  flatDoubleTape: 'À PLAT',
};

/** Modèle Régulier : rien ; sinon entre doubles étoiles */
function modelNote(model: FrameModel | null): string {
  if (!model || model.type === 'regular') return '';
  return model.type === 'prestige' ? ' **PRESTIGE**' : ` **${upper(model.description)}**`;
}

function addonNote(a: AddonAssignment): string {
  switch (a.addon) {
    case 'other':
      return upper(a.mention);
    case 'customNoMention':
      return a.details ? `PERSO [${a.details.trim()}]` : 'PERSO';
    default:
      return 'model' in a ? `${ADDON_NOTE_LABELS[a.addon]}${modelNote(a.model)}` : ADDON_NOTE_LABELS[a.addon];
  }
}

/**
 * Ajout ou affichette de visite libre, sous une forme commune : son libellé (après « AJOUT ») et sa répartition.
 * Les affichettes de visite libre se notent comme un ajout « VISITE LIBRE ».
 */
interface AddonEntry extends UnitTargets {
  label: string;
  placements: Placement[] | null;
}

/** 'yyyy-MM-dd' → 'MERCREDI' (jour en heure locale, sans décalage de fuseau) */
const weekday = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return upper(format(new Date(y, m - 1, d), 'EEEE', { locale: frCA }));
};

/** '14:15' → '14h15' */
const noteTime = (time: string): string => time.replace(':', 'h');

/** VISITE LIBRE MERCREDI 14h15-16h15 (deux dates : SAMEDI ET DIMANCHE) */
function openHouseLabel(o: NonNullable<InstallationDetails['openHouse']>): string {
  const days = o.dates.map(weekday).join(' ET ');
  return ['VISITE LIBRE', days, `${noteTime(o.startTime)}-${noteTime(o.endTime)}`].filter(Boolean).join(' ');
}

function addonEntries(details: InstallationDetails): AddonEntry[] {
  return [
    ...(details.addons ?? []).map((a) => ({ ...a, label: addonNote(a) })),
    ...(details.openHouse ? [{ ...details.openHouse, label: openHouseLabel(details.openHouse) }] : []),
  ];
}

/** Emplacements de directionnelles, dans l'ordre ; vide → « ... » ; aucun rempli → rien */
function placesList(placements: readonly string[]): string {
  const places = placements.map((p) => p.trim());
  return places.some(Boolean) ? ` [${places.map((p) => p || '...').join(' / ')}]` : '';
}

/** Directionnelles de la visite libre : 5x DIRECTIONNELLES [...], sans mention ni nom */
function openHouseDirectionalsNote(units: readonly { placement: string }[], verb = ''): string | null {
  if (units.length === 0) return null;
  const name = units.length > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE';
  return `${quantityPrefix(units.length)}${verb}${name}${placesList(units.map((u) => u.placement))}`;
}

/** Accès (fenêtre, balcon) : le libellé, et le détail entre parenthèses (téléphone, infos de la boîte) */
export function accessNote(access: PlacementAccess): { label: string; detail: string | null } {
  switch (access.type) {
    case 'phoneAppointment':
      return { label: ' AVEC RDV', detail: access.contact.trim() };
    case 'keybox':
      return { label: ' VIA BAC', detail: access.info.trim() };
    case 'ladder':
      return { label: LADDER_NOTE_LABELS[access.ladder], detail: null };
  }
}

/** Emplacement d'une pancarte ou d'un ajout, entre doubles étoiles */
export function placementNote(p: Placement): string | null {
  switch (p.location) {
    case 'ground':
      return '**AU SOL**';
    case 'ramp':
      return '**SUR RAMPE**';
    case 'window': {
      const side = p.side === 'interior' ? 'INTÉRIEUR' : 'EXTÉRIEUR';
      const { label, detail } = accessNote(p.access);
      return `**FENÊTRE ${side}${label}**${detail ? ` (${detail})` : ''}`;
    }
    case 'wall':
      return `**MUR${LADDER_NOTE_LABELS[p.ladder]}${p.mounting ? ` - ${MOUNTING_NOTE_LABELS[p.mounting]}` : ''}**`;
    case 'balcony': {
      const { label, detail } = accessNote(p.access);
      // Fixation absente des balcons enregistrés avant son ajout
      const mounting = p.mounting ? ` - ${MOUNTING_NOTE_LABELS[p.mounting]}` : '';
      return `**BALCON${label}${mounting}**${detail ? ` (${detail})` : ''}`;
    }
    case 'other':
      // Description libre : entre crochets, telle que saisie
      return `[${p.description.trim()}]`;
  }
}

/** Une pancarte et ses ajouts, avant regroupement des pancartes identiques */
interface FrameEntry {
  kit: string;
  addons: string[];
  placement: string | null;
}

function frameEntry(unit: FrameUnit, addons: readonly AddonEntry[], accountName: string | null): FrameEntry {
  const account = accountName ? upper(accountName) : '';
  const name =
    unit.displayName?.type === 'account' ? upper(unit.displayName.name)
    : unit.displayName?.type === 'custom'
      // Nom affiché différent du compte : le compte entre parenthèses
      ? `${upper(unit.displayName.names)}${account && account !== upper(unit.displayName.names) ? ` (${account})` : ''}`
      : account;

  return {
    kit: `${['KIT', name].filter(Boolean).join(' ')}${modelNote(unit.model)}`,
    addons: addons.filter((a) => a.frameUids.includes(unit.uid)).map((a) => `AJOUT ${a.label}`),
    placement: placementNote(unit.placement),
  };
}

/** Pancartes identiques regroupées : 2x KIT … + 2x AJOUT … **EMPLACEMENT** */
/**
 * Ordre des pancartes dans les notes : rendez-vous d'abord, puis « Autres », puis le reste,
 * et l'accès par boîte à clés en dernier. Dans un même groupe, l'ordre du formulaire est gardé.
 */
function placementPriority(p: Placement): number {
  const access = p.location === 'window' || p.location === 'balcony' ? p.access.type : null;
  if (access === 'phoneAppointment') return 0;
  if (p.location === 'other') return 1;
  if (access === 'keybox') return 3;
  return 2;
}

function framesNotes(units: readonly FrameUnit[], addons: readonly AddonEntry[], accountName: string | null): string[] {
  const groups = new Map<string, { entry: FrameEntry; count: number }>();
  // Tri stable : l'ordre du formulaire est conservé à priorité égale
  const ordered = [...units].sort((a, b) => placementPriority(a.placement) - placementPriority(b.placement));
  for (const [index, unit] of ordered.entries()) {
    // Le nom du compte n'apparaît qu'une fois : sur la première pancarte
    const entry = frameEntry(unit, addons, index === 0 ? accountName : null);
    const key = JSON.stringify(entry);
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { entry, count: 1 });
  }

  return [...groups.values()].map(({ entry, count }) => {
    const prefix = count > 1 ? `${count}x ` : '';
    const parts = [entry.kit, ...entry.addons].map((part) => `${prefix}${part}`).join(' + ');
    return entry.placement ? `${parts} ${entry.placement}` : parts;
  });
}

const quantityPrefix = (n: number): string => (n > 1 ? `${n}x ` : '');

/**
 * Ajouts qui ne vont pas sur une pancarte de la demande.
 * - Avec des pancartes commandées : les unités prévues pour une pancarte déjà sur place,
 *   toujours avec leur nombre : 1x AJOUT 2e ÉTAGE [PANCARTE DÉJÀ SUR PLACE]
 * - Sans pancarte commandée : AJOUT À VENDRE {COMPTE} + AJOUT REZ-DE-CHAUSSÉE **SUR RAMPE**
 *   (quantité à partir de 2, nom du compte une seule fois, après le premier ajout)
 */
function standaloneAddonNotes(addons: readonly AddonEntry[], hasFrames: boolean, accountName: string | null): string[] {
  if (hasFrames) {
    return addons.flatMap((a) =>
      a.onSiteCount > 0 ? [`${a.onSiteCount}x AJOUT ${a.label} [PANCARTE DÉJÀ SUR PLACE]`] : [],
    );
  }

  return addons.map((a, index) => {
    const account = index === 0 && accountName ? ` ${upper(accountName)}` : '';
    const places = (a.placements ?? []).map(placementNote).filter((p): p is string => p !== null);
    const note = `${quantityPrefix(a.quantity)}AJOUT ${a.label}${account}`;
    return places.length > 0 ? `${note} ${places.join(' / ')}` : note;
  });
}

/**
 * Emplacement d'un kit : au sol, rampe et « Autres » (fenêtre, mur et balcon sont ignorés).
 * « Autres » : la description telle que saisie, entre crochets.
 */
function kitPlacementNote(p: Placement): string | null {
  switch (p.location) {
    case 'ground':
      return '**AU SOL**';
    case 'ramp':
      return '**SUR RAMPE**';
    case 'other':
      return `[${p.description.trim()}]`;
    default:
      return null;
  }
}

/**
 * Kits (ancrage et poteau) sans pancarte : POTEAU {MODÈLE} {COMPTE} (description du poteau spécifique) [emplacement « Autres »].
 * Les kits identiques sont regroupés.
 */
function kitsNotes(units: readonly KitUnit[], accountName: string | null): string[] {
  const groups = new Map<string, number>();
  for (const [index, unit] of units.entries()) {
    const placement = kitPlacementNote(unit.placement);
    // Le nom du compte n'apparaît qu'une fois : sur le premier kit
    const name = index === 0 && accountName ? upper(accountName) : '';
    // Poteau spécifique : sa description telle que saisie, entre parenthèses
    const description = unit.model.type === 'custom' && unit.model.description.trim() ? `(${unit.model.description.trim()})` : '';
    const note = ['POTEAU', KIT_MODEL_NOTE_LABELS[unit.model.type], name, description, placement ?? '']
      .filter(Boolean)
      .join(' ');
    groups.set(note, (groups.get(note) ?? 0) + 1);
  }
  return [...groups].map(([note, count]) => `${quantityPrefix(count)}${note}`);
}

/**
 * Directionnelles : 3x DIRECTIONNELLES **À LOUER** {COMPTE} [emplacement 1 / emplacement 2 / ...]
 * Les emplacements suivent l'ordre des directionnelles ; un emplacement vide devient « ... ».
 * Aucun emplacement rempli : pas de crochets.
 */
function directionalsNote(
  directionals: InstallationDetails['directionals'],
  accountName: string | null,
): string | null {
  if (!directionals) return null;
  const { units } = directionals;
  const count = units.length;
  // Invités : mention saisie librement, en majuscules
  const mention = directionals.mention === 'other' ? upper(directionals.customMention) : SIGN_MENTION_NOTE_LABELS[directionals.mention];
  const head = [
    `${quantityPrefix(count)}${count > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE'}`,
    mention ? `**${mention}**` : '',
    accountName ? upper(accountName) : '',
  ].filter(Boolean).join(' ');

  return `${head}${placesList(units.map((u) => u.placement))}`;
}

/**
 * Résumé de l'installation. Encore à définir : drapeaux de la visite libre.
 * Si rien n'est encore couvert, « INSTALLATION ».
 */
export function buildInstallationNotes(details: InstallationDetails, accountName: string | null): string {
  const addons = addonEntries(details);
  const hasFrames = details.frames !== null;

  // Le nom du compte n'apparaît qu'une fois par note : sur le premier élément qui en produit une
  const parts: string[] = [];
  let account = accountName;
  const add = (build: (account: string | null) => (string | null)[]) => {
    const notes = build(account).filter((n): n is string => n !== null);
    if (notes.length > 0) {
      parts.push(...notes);
      account = null;
    }
  };

  if (details.frames) add((a) => framesNotes(details.frames?.units ?? [], addons, a));
  if (details.kits) add((a) => kitsNotes(details.kits?.units ?? [], a));
  add((a) => standaloneAddonNotes(addons, hasFrames, a));
  if (details.openHouse) add(() => [openHouseDirectionalsNote(details.openHouse?.directionals ?? [])]);
  if (details.keybox) add((a) => [keyboxNote(details.keybox, a)]);
  if (details.directionals) add((a) => [directionalsNote(details.directionals, a)]);
  if (details.flags) add((a) => [flagsNote(details.flags, a)]);
  if (details.otherNeeds?.trim()) add((a) => [`MATÉRIEL ${upper(details.otherNeeds ?? '')}${a ? ` ${upper(a)}` : ''}`]);

  return parts.length > 0 ? parts.join(' + ') : 'INSTALLATION';
}

/** BAC{CODE} {COMPTE} ({EMPLACEMENT}) */
function keyboxNote(keybox: InstallationDetails['keybox'], account: string | null): string | null {
  if (!keybox) return null;
  const name = account ? ` ${upper(account)}` : '';
  const placement = keybox.placement.trim() ? ` (${upper(keybox.placement)})` : '';
  return `BAC${keybox.code}${name}${placement}`;
}

const FLAG_MENTION_NOTE_LABELS = { forSale: 'À VENDRE', sold: 'VENDU' } as const;

/** 2x DRAPEAU {MENTION} {COMPTE} ({emplacement tel que saisi}) */
function flagsNote(flags: InstallationDetails['flags'], account: string | null): string | null {
  if (!flags) return null;
  const mention = flags.mention === 'other' ? upper(flags.customMention) : FLAG_MENTION_NOTE_LABELS[flags.mention];
  const name = account ? ` ${upper(account)}` : '';
  const placement = flags.placement.trim() ? ` (${flags.placement.trim()})` : '';
  return `${quantityPrefix(flags.quantity)}DRAPEAU ${mention}${name}${placement}`;
}

/**
 * Note de la tâche de retrait du lundi suivant la visite libre (« Oui » au retrait), à part de l'installation :
 * 2x RECUP AJOUT VISITE LIBRE {COMPTE} **EMPLACEMENT** + 5x RECUP DIRECTIONNELLES [...]
 * Sans jour ni heure : la date est celle de la tâche. null si aucun retrait n'est demandé.
 */
export function buildOpenHouseRemovalNotes(details: InstallationDetails, accountName: string | null): string | null {
  const o = details.openHouse;
  if (!o?.removeNextMonday) return null;

  const account = accountName ? ` ${upper(accountName)}` : '';
  // Sans pancarte commandée, les affichettes ont leurs propres emplacements
  const places = (o.placements ?? []).map(placementNote).filter((p): p is string => p !== null);
  const signs = `${quantityPrefix(o.quantity)}RECUP AJOUT VISITE LIBRE${account}${places.length > 0 ? ` ${places.join(' / ')}` : ''}`;

  return [signs, openHouseDirectionalsNote(o.directionals, 'RECUP ')].filter((n): n is string => n !== null).join(' + ');
}
