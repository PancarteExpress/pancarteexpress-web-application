import { describe, expect, it } from 'vitest';
import { buildAddressNotes, buildServiceNotes } from './notes';

describe('buildServiceNotes', () => {
  it('suit l\'ordre : installation, livraison, récupération, correction, ramassage', () => {
    expect(buildServiceNotes(['pickup', 'correction', 'removal', 'delivery', 'installation']))
      .toBe('INSTALLATION + LIVRER + RECUP + CORRECTION + PICK UP');
  });

  it('chaque service une seule fois', () => {
    expect(buildServiceNotes(['removal', 'installation', 'removal'])).toBe('INSTALLATION + RECUP');
  });

  it('aucun service : texte vide', () => {
    expect(buildServiceNotes([])).toBe('');
  });
});

describe('buildAddressNotes — pièces jointes', () => {
  it('**VOIR PHOTO** à la toute fin quand des fichiers sont joints', () => {
    expect(buildAddressNotes([{ type: 'installation' }, { type: 'removal' }], null, { hasAttachments: true }))
      .toBe('INSTALLATION + RECUP **VOIR PHOTO**');
  });

  it('terrain : **TERRAIN** [description] à la fin, avant **VOIR PHOTO**', () => {
    expect(buildAddressNotes(
      [{ type: 'pickup', materials: ['frames', 'anchors', 'other'], newModels: false, details: 'blablabla' }],
      'Natasha Fournier',
      { terrain: 'Terrain qui se trouve entre le 4500 et le 4510', hasAttachments: true },
    )).toBe(
      'PICK UP NATASHA FOURNIER [Pancartes, Ancrages, Autres / Blablabla] '
      + '**TERRAIN** [Terrain qui se trouve entre le 4500 et le 4510] **VOIR PHOTO**',
    );
  });

  it('installation + retrait de boîte à clés : nom du compte une seule fois, RECUP BAC', () => {
    expect(buildAddressNotes(
      [
        {
          type: 'installation', pickupAddress: null, frames: null, kits: null, openHouse: null, keybox: null,
          flags: null, directionals: null, otherNeeds: null,
          addons: [{ addon: 'sold', model: { type: 'prestige' }, quantity: 1, frameUids: [], onSiteCount: 1, placements: null }],
        },
        {
          type: 'removal', afterRemoval: null, frames: null, addons: null, flags: null, directionals: null, otherDetails: null,
          keybox: { quantity: 1, code: '1234', placement: 'Sur le rack à vélo' },
        },
      ],
      'Natasha Fournier',
    )).toBe('AJOUT VENDU **PRESTIGE** NATASHA FOURNIER + RECUP BAC1234 (Sur le rack à vélo)');
  });

  it('sans fichier : rien de plus', () => {
    expect(buildAddressNotes([{ type: 'installation' }], null)).toBe('INSTALLATION');
  });
});
