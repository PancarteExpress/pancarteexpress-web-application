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


const ADDON_LABELS = {
  forSale: 'À VENDRE',
  sold: 'VENDU',
  forRent: 'À LOUER',
  rented: 'LOUÉ',
} as const;

/** 20x AJOUT À VENDRE ; 10x PERSO (modèle tel que saisi) ; 5x AJOUT {MENTION SAISIE} */
function addonModelNote(a: DeliveryAddonItem): string {
  switch (a.addon) {
    case 'customNoMention':
      return `${a.quantity}x PERSO${a.model?.trim() ? ` (${a.model.trim()})` : ''}`;
    case 'other':
      return `${a.quantity}x AJOUT ${upper(a.mention)}`;
    case 'openHouse':
      // Heures telles que saisies, si elles sont précisées
      return `${a.quantity}x AJOUT VISITE LIBRE${a.hours?.trim() ? ` (${a.hours.trim()})` : ''}`;
    default:
      return `${a.quantity}x AJOUT ${ADDON_LABELS[a.addon]}`;
  }
}



const DIRECTIONAL_LABELS = { forSale: 'À VENDRE', openHouse: 'VISITE LIBRE' } as const;

/** 5x DIRECTIONNELLES À VENDRE (avec poteaux) ; modèle particulier : *description telle que saisie* */
function directionalModelNote(d: DeliveryDirectional): string {
  const model = d.model === 'custom' ? `*${d.description.trim()}*` : DIRECTIONAL_LABELS[d.model];
  const name = d.quantity > 1 ? 'DIRECTIONNELLES' : 'DIRECTIONNELLE';
  return `${d.quantity}x ${name} ${model}${d.withPoles ? ' (avec poteaux)' : ''}`;
}



/**
 * Résumé de la livraison : tous les modèles dans une seule liste, dans l'ordre
 * pancartes, ajouts, boîtes à clés, directionnelles, autres.
 * - plusieurs modèles : LIVRER {COMPTE}: [2x KIT RÉGULIER, 1x KIT PRESTIGE, 5x AJOUT À VENDRE]
 * - un seul : LIVRER 2x KIT {COMPTE} (Régulier sous-entendu)
 * Si rien n'est couvert, « LIVRER ».
 */
export function buildDeliveryNotes(details: DeliveryDetails, accountName: string | null): string {
  const items = [
    ...(details.frames ?? []).map(frameModelNote),
    ...(details.addons ?? []).map(addonModelNote),
    ...(details.keybox ? [`${details.keybox.quantity}x BAC${details.keybox.code ?? ''}`] : []),
    ...(details.directionals ?? []).map(directionalModelNote),
    ...(details.others ?? []).map((o) => `${o.quantity}x ${upper(o.description)}`),
  ];
  const name = accountName ? ` ${upper(accountName)}` : '';

  if (items.length === 0) return 'LIVRER';
  // Un seul modèle : le Régulier est sous-entendu
  if (items.length === 1) return `LIVRER ${items[0].replace(/^(\d+x KIT) RÉGULIER/, '$1')}${name}`;
  return `LIVRER${name}: [${items.join(', ')}]`;
}
