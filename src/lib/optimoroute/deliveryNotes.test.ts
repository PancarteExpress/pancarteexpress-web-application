import { describe, expect, it } from 'vitest';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import { buildDeliveryNotes } from './deliveryNotes';

const empty: DeliveryDetails = { frames: null, addons: null, keybox: null, directionals: null, others: null };

describe('buildDeliveryNotes — pancartes', () => {
  it('ton exemple : total, nombre de modèles, compte, liste des modèles', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      frames: [
        { model: 'regular', quantity: 20, withAnchorsAndPoles: false },
        { model: 'prestige', quantity: 10, withAnchorsAndPoles: true },
        { model: 'custom', description: 'Ceci est un modele iphone', quantity: 5, withAnchorsAndPoles: false },
        { model: 'custom', description: 'Ancienne photo', quantity: 1, withAnchorsAndPoles: false },
      ],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      'LIVRER 36x PANCARTES (4 modèles) CRISTIAN FERMIN LOPEZ: [20x KIT RÉGULIER, '
      + '10x KIT PRESTIGE (avec poteaux et ancrages), 5x KIT CECI EST UN MODELE IPHONE, 1x KIT ANCIENNE PHOTO]',
    );
  });

  it('une seule pancarte, sans compte', () => {
    const notes = buildDeliveryNotes({ ...empty, frames: [{ model: 'regular', quantity: 1, withAnchorsAndPoles: false }] }, null);
    expect(notes).toBe('LIVRER 1x PANCARTE (1 modèle): [1x KIT RÉGULIER]');
  });

  it('ajouts : ton exemple', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      addons: [
        { addon: 'forSale', quantity: 20 },
        { addon: 'customNoMention', model: "c'es le modele avec des etoiles par dessus", quantity: 10 },
        { addon: 'other', mention: "c'es le modele avec des cercles par dessus", quantity: 5 },
        { addon: 'openHouse', quantity: 3 },
        { addon: 'rented', quantity: 1 },
      ],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      "LIVRER 39x AJOUTS (5 modèles) CRISTIAN FERMIN LOPEZ: [20x AJOUT À VENDRE, 10x PERSO (c'es le modele avec des etoiles par dessus), "
      + "5x AJOUT C'ES LE MODELE AVEC DES CERCLES PAR DESSUS, 3x AJOUT VISITE LIBRE, 1x AJOUT LOUÉ]",
    );
  });

  it('pancartes puis ajouts : le nom du compte une seule fois', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      frames: [{ model: 'regular', quantity: 2, withAnchorsAndPoles: false }],
      addons: [{ addon: 'sold', quantity: 10 }],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      'LIVRER 2x PANCARTES (1 modèle) CRISTIAN FERMIN LOPEZ: [2x KIT RÉGULIER] + LIVRER 10x AJOUTS (1 modèle): [10x AJOUT VENDU]',
    );
  });

  it('boîtes à clés : LIVRER 3x BAC{CODE} {COMPTE}:', () => {
    expect(buildDeliveryNotes({ ...empty, keybox: { quantity: 3, code: '111111' } }, 'Cristian Fermin Lopez'))
      .toBe('LIVRER 3x BAC111111 CRISTIAN FERMIN LOPEZ:');
  });

  it('directionnelles : ton exemple', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      directionals: [
        { model: 'forSale', quantity: 5, withPoles: true },
        { model: 'openHouse', quantity: 5, withPoles: false },
        { model: 'custom', description: 'le modele avec les etoiles', quantity: 5, withPoles: true },
      ],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      'LIVRER 15x DIRECTIONNELLES (3 modèles) CRISTIAN FERMIN LOPEZ: [5x DIRECTIONNELLES À VENDRE (avec poteaux), '
      + '5x DIRECTIONNELLES VISITE LIBRE, 5x DIRECTIONNELLES *le modele avec les etoiles* (avec poteaux)]',
    );
  });

  it('autres : LIVRER MATÉRIEL {COMPTE}: [liste]', () => {
    const notes = buildDeliveryNotes({
      ...empty,
      others: [{ description: 'Panneaux solaires', quantity: 4 }, { description: 'Kit de déménagement', quantity: 1 }],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('LIVRER MATÉRIEL CRISTIAN FERMIN LOPEZ: [4x PANNEAUX SOLAIRES, 1x KIT DE DÉMÉNAGEMENT]');
  });

  it('rien de couvert encore : LIVRER', () => {
    expect(buildDeliveryNotes(empty, null)).toBe('LIVRER');
  });
});
