import type {
  DeliveryAddonItem, DeliveryDetails, DeliveryDirectional, DeliveryFrame,
} from '@/features/services/types/delivery';
import { upper } from './installationNotes';

/*
 * Résumé d'une livraison dans les notes OptimoRoute, selon la nomenclature de l'équipe.
 * Sans dépendance serveur : l'aperçu du formulaire et l'envoi réel utilisent le même texte.
 */

const FRAME_MODEL_LABELS = { regular: 'RÉGULIER', prestige: 'PRESTIGE' } as const;

/** 10x KIT PRESTIGE (avec poteaux et ancrages) */
function frameModelNote(f: DeliveryFrame): string {
  const model = f.model === 'custom' ? upper(f.description) : FRAME_MODEL_LABELS[f.model];
  return `${f.quantity}x KIT ${model}${f.withAnchorsAndPoles ? ' (avec poteaux et ancrages)' : ''}`;
}

/** LIVRER 36x PANCARTES (4 modèles) {COMPTE}: [20x KIT RÉGULIER, 10x KIT PRESTIGE (avec poteaux et ancrages), …] */
function framesNote(frames: DeliveryDetails['frames'], account: string | null): string | null {
  if (!frames || frames.length === 0) return null;
  const total = frames.reduce((sum, f) => sum + f.quantity, 0);
  const models = `${frames.length} ${frames.length > 1 ? 'modèles' : 'modèle'}`;
  const name = account ? ` ${upper(account)}` : '';
  return `LIVRER ${total}x ${total > 1 ? 'PANCARTES' : 'PANCARTE'} (${models})${name}: [${frames.map(frameModelNote).join(', ')}]`;
}

const ADDON_LABELS = {
  forSale: 'À VENDRE',
  sold: 'VENDU',
  forRent: 'À LOUER',
  rented: 'LOUÉ',
  openHouse: 'VISITE LIBRE',
} as const;

/** 20x AJOUT À VENDRE ; 10x PERSO (modèle tel que saisi) ; 5x AJOUT {MENTION SAISIE} */
function addonModelNote(a: DeliveryAddonItem): string {
  switch (a.addon) {
    case 'customNoMention':
      return `${a.quantity}x PERSO${a.model?.trim() ? ` (${a.model.trim()})` : ''}`;
    case 'other':
      return `${a.quantity}x AJOUT ${upper(a.mention)}`;
    default:
      return `${a.quantity}x AJOUT ${ADDON_LABELS[a.addon]}`;
  }
}

/** LIVRER 39x AJOUTS (5 modèles) {COMPTE}: [20x AJOUT À VENDRE, 10x PERSO (…), …] */
function addonsNote(addons: DeliveryDetails['addons'], account: string | null): string | null {
  if (!addons || addons.length === 0) return null;
  const total = addons.reduce((sum, a) => sum + a.quantity, 0);
  const models = `${addons.length} ${addons.length > 1 ? 'modèles' : 'modèle'}`;
  const name = account ? ` ${upper(account)}` : '';
  return `LIVRER ${total}x ${total > 1 ? 'AJOUTS' : 'AJOUT'} (${models})${name}: [${addons.map(addonModelNote).join(', ')}]`;
}

/** LIVRER 3x BAC{CODE} {COMPTE}: */
function keyboxNote(keybox: DeliveryDetails['keybox'], account: string | null): string | null {
  if (!keybox) return null;
  const name = account ? ` ${upper(account)}:` : '';
  return `LIVRER ${keybox.quantity}x BAC${keybox.code ?? ''}${name}`;
}

const DIRECTIONAL_LABELS = { forSale: 'À VENDRE', openHouse: 'VISITE LIBRE' } as const;

/** 5x DIRECTIONNELLES À VENDRE (avec poteaux) ; modèle particulier : *description telle que saisie* */
function directionalModelNote(d: DeliveryDirectional): string {
  const model = d.model === 'custom' ? `*${d.description.trim()}*` : DIRECTIONAL_LABELS[d.model];
  const name = d.quantity > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE';
  return `${d.quantity}x ${name} ${model}${d.withPoles ? ' (avec poteaux)' : ''}`;
}

/** LIVRER 15x DIRECTIONNELLES (3 modèles) {COMPTE}: [5x DIRECTIONNELLES À VENDRE (avec poteaux), …] */
function directionalsNote(directionals: DeliveryDetails['directionals'], account: string | null): string | null {
  if (!directionals || directionals.length === 0) return null;
  const total = directionals.reduce((sum, d) => sum + d.quantity, 0);
  const models = `${directionals.length} ${directionals.length > 1 ? 'modèles' : 'modèle'}`;
  const name = account ? ` ${upper(account)}` : '';
  const head = `LIVRER ${total}x ${total > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE'} (${models})${name}`;
  return `${head}: [${directionals.map(directionalModelNote).join(', ')}]`;
}

/** LIVRER MATÉRIEL {COMPTE}: [4x PANNEAUX SOLAIRES, 1x KIT DE DÉMÉNAGEMENT] */
function othersNote(others: DeliveryDetails['others'], account: string | null): string | null {
  if (!others || others.length === 0) return null;
  const name = account ? ` ${upper(account)}` : '';
  return `LIVRER MATÉRIEL${name}: [${others.map((o) => `${o.quantity}x ${upper(o.description)}`).join(', ')}]`;
}

/**
 * Résumé de la livraison : pancartes, ajouts, boîtes à clés, directionnelles, autres.
 * Le nom du compte n'apparaît qu'une fois, sur le premier élément. Si rien n'est couvert, « LIVRER ».
 */
export function buildDeliveryNotes(details: DeliveryDetails, accountName: string | null): string {
  const parts: string[] = [];
  let account = accountName;
  for (const build of [
    (a: string | null) => framesNote(details.frames, a),
    (a: string | null) => addonsNote(details.addons, a),
    (a: string | null) => keyboxNote(details.keybox, a),
    (a: string | null) => directionalsNote(details.directionals, a),
    (a: string | null) => othersNote(details.others, a),
  ]) {
    const note = build(account);
    if (note) {
      parts.push(note);
      account = null;
    }
  }
  return parts.length > 0 ? parts.join(' + ') : 'LIVRER';
}
