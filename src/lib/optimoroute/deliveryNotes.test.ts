import { describe, expect, it } from 'vitest';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import { buildDeliveryNotes } from './deliveryNotes';

const empty: DeliveryDetails = { frames: null, addons: null, keybox: null, directionals: null, others: null };
const NAME = 'Natasha Fournier';

describe('buildDeliveryNotes', () => {
  it('pancartes et ajouts : une seule liste', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      frames: [{ model: 'regular', quantity: 2, withAnchorsAndPoles: false }],
      addons: [{ addon: 'forSale', quantity: 1 }],
    }, NAME);
    expect(notes).toBe('LIVRER NATASHA FOURNIER: [2x KIT RÉGULIER, 1x AJOUT À VENDRE]');
  });

  it('un seul modèle Régulier : LIVRER 2x KIT {COMPTE}', () => {
    const notes = buildDeliveryNotes({ ...empty, frames: [{ model: 'regular', quantity: 2, withAnchorsAndPoles: false }] }, NAME);
    expect(notes).toBe('LIVRER 2x KIT NATASHA FOURNIER');
  });

  it('un seul modèle, autre que Régulier : le modèle est gardé', () => {
    const notes = buildDeliveryNotes({ ...empty, frames: [{ model: 'prestige', quantity: 1, withAnchorsAndPoles: true }] }, NAME);
    expect(notes).toBe('LIVRER 1x KIT PRESTIGE (avec poteaux et ancrages) NATASHA FOURNIER');
  });

  it('plusieurs modèles de chaque : tous dans la même liste, dans l\'ordre', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      frames: [
        { model: 'regular', quantity: 2, withAnchorsAndPoles: false },
        { model: 'prestige', quantity: 1, withAnchorsAndPoles: false },
      ],
      addons: [
        { addon: 'forSale', quantity: 5 },
        { addon: 'sold', quantity: 5 },
        { addon: 'customNoMention', model: 'modèle étoilé', quantity: 2 },
        { addon: 'openHouse', hours: 'Samedi 14 h à 16 h', quantity: 3 },
      ],
      keybox: { quantity: 3, code: '111111' },
      directionals: [{ model: 'custom', description: 'le modele avec les etoiles', quantity: 5, withPoles: true }],
      others: [{ description: 'Panneaux solaires', quantity: 4 }],
    }, NAME);
    expect(notes).toBe(
      'LIVRER NATASHA FOURNIER: [2x KIT RÉGULIER, 1x KIT PRESTIGE, 5x AJOUT À VENDRE, 5x AJOUT VENDU, '
      + '2x PERSO (modèle étoilé), 3x AJOUT VISITE LIBRE (Samedi 14 h à 16 h), 3x BAC111111, '
      + '5x DIRECTIONNELLES *le modele avec les etoiles* (avec poteaux), 4x PANNEAUX SOLAIRES]',
    );
  });

  it('un seul élément, boîte à clés : LIVRER 3x BAC{CODE} {COMPTE}', () => {
    expect(buildDeliveryNotes({ ...empty, keybox: { quantity: 3, code: '111111' } }, 'Cristian Fermin Lopez'))
      .toBe('LIVRER 3x BAC111111 CRISTIAN FERMIN LOPEZ');
  });

  it('sans compte (nom déjà donné à un autre service de l\'adresse)', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      frames: [{ model: 'regular', quantity: 2, withAnchorsAndPoles: false }],
      addons: [{ addon: 'sold', quantity: 10 }],
    }, null);
    expect(notes).toBe('LIVRER: [2x KIT RÉGULIER, 10x AJOUT VENDU]');
  });

  it('rien de couvert encore : LIVRER', () => {
    expect(buildDeliveryNotes(empty, null)).toBe('LIVRER');
  });
});
