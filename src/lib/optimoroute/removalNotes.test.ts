import { describe, expect, it } from 'vitest';
import type { RemovalDetails } from '@/features/services/types/removal';
import { buildRemovalNotes } from './removalNotes';

const empty: RemovalDetails = {
  afterRemoval: null, frames: null, addons: null, keybox: null, flags: null, directionals: null, otherDetails: null,
};

describe('buildRemovalNotes — pancartes', () => {
  it('ton exemple : emplacements particuliers d\'abord, au sol à la fin', () => {
    const notes = buildRemovalNotes({
      ...empty,
      frames: {
        units: [
          { uid: 'f1', placement: { location: 'ground' } },
          {
            uid: 'f2',
            placement: {
              location: 'window',
              side: 'interior',
              access: { type: 'phoneAppointment', contact: 'Pour la prise de rendez-vous veuillez appeler au 438 722 3922' },
            },
          },
          { uid: 'f3', placement: { location: 'other', description: 'Cette pancarte se trouve a coter du mur bleu' } },
        ],
      },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      '3x RECUP CRISTIAN FERMIN LOPEZ [**FENÊTRE INTÉRIEUR AVEC RDV** (Pour la prise de rendez-vous veuillez appeler au 438 722 3922) '
      + '/ Cette pancarte se trouve a coter du mur bleu / Au sol]',
    );
  });

  it('fenêtre sans côté (facultatif au retrait) : FENÊTRE seul', () => {
    const notes = buildRemovalNotes({
      ...empty,
      frames: { units: [{ uid: 'f1', placement: { location: 'window', side: null, access: { type: 'ladder', ladder: 'noLadder' } } }] },
    }, null);
    expect(notes).toBe('RECUP [**FENÊTRE SANS ÉCHELLE**]');
  });

  it('mur sans fixation (facultative au retrait) : MUR {ÉCHELLE}', () => {
    const notes = buildRemovalNotes({
      ...empty,
      frames: { units: [{ uid: 'f1', placement: { location: 'wall', ladder: 'smallLadder', mounting: null } }] },
    }, null);
    expect(notes).toBe('RECUP [**MUR ÉCHELLE 6-12**]');
  });

  it('une seule pancarte, sur rampe', () => {
    const notes = buildRemovalNotes({ ...empty, frames: { units: [{ uid: 'f1', placement: { location: 'ramp' } }] } }, null);
    expect(notes).toBe('RECUP [**SUR RAMPE**]');
  });

  it('ajouts : précision, emplacements du retrait (balcon, fenêtre, mur)', () => {
    const notes = buildRemovalNotes({
      ...empty,
      addons: {
        units: [
          { uid: 'a1', placement: { location: 'balcony', access: { type: 'keybox', info: 'le code est 111111' }, mounting: null } },
          { uid: 'a2', placement: { location: 'window', side: 'exterior', access: { type: 'ladder', ladder: 'smallLadder' } } },
          { uid: 'a3', placement: { location: 'wall', ladder: 'noLadder', mounting: 'vShapeDrilled' } },
        ],
        details: "voici la précision pour les ajouts à retirer : l'ajout avec un étoile",
      },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      "3x RECUP AJOUT PRÉCIS (voici la précision pour les ajouts à retirer : l'ajout avec un étoile) CRISTIAN FERMIN LOPEZ "
      + '[**BALCON VIA BAC** (le code est 111111) / **FENÊTRE EXTÉRIEUR ÉCHELLE 6-12** / **MUR EN V SANS ÉCHELLE**]',
    );
  });

  it('pancartes puis ajouts : le nom du compte une seule fois', () => {
    const notes = buildRemovalNotes({
      ...empty,
      frames: { units: [{ uid: 'f1', placement: { location: 'ground' } }] },
      addons: { units: [{ uid: 'a1', placement: { location: 'ground' } }], details: null },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('RECUP CRISTIAN FERMIN LOPEZ [Au sol] + RECUP AJOUT [Au sol]');
  });

  it('boîtes à clés : sans RECUP, emplacement tel que saisi', () => {
    const notes = buildRemovalNotes({
      ...empty,
      keybox: { quantity: 2, code: '111111', placement: "l'emplacement de la boite à clé est ici" },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe("2x BAC111111 CRISTIAN FERMIN LOPEZ (l'emplacement de la boite à clé est ici)");
  });

  it('drapeaux : mention « Autres » en majuscules, emplacement tel que saisi', () => {
    const notes = buildRemovalNotes({
      ...empty,
      flags: { mention: 'other', customMention: 'drapeau à louer', quantity: 2, placement: 'les drapeaux se trouve a gauche du rocher' },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('2x RECUP DRAPEAU DRAPEAU À LOUER CRISTIAN FERMIN LOPEZ (les drapeaux se trouve a gauche du rocher)');
  });

  it('directionnelles : mention sans étoiles, emplacements', () => {
    const notes = buildRemovalNotes({
      ...empty,
      directionals: {
        mention: 'forRent',
        units: [
          { uid: 'd1', placement: 'Newman et leger' },
          { uid: 'd2', placement: 'Newman et leger' },
          { uid: 'd3', placement: 'Newman et leger' },
        ],
      },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('3x RECUP DIRECTIONNELLES À LOUER CRISTIAN FERMIN LOPEZ [Newman et leger / Newman et leger / Newman et leger]');
  });

  it('autres : RECUP MATÉRIEL {TEXTE} {COMPTE}', () => {
    expect(buildRemovalNotes({ ...empty, otherDetails: 'Affichette random' }, 'Cristian Fermin Lopez'))
      .toBe('RECUP MATÉRIEL AFFICHETTE RANDOM CRISTIAN FERMIN LOPEZ');
  });

  it('drapeaux d\'un ancien retrait, sans mention : mention omise', () => {
    expect(buildRemovalNotes({ ...empty, flags: { mention: null, quantity: 1, placement: '' } }, null)).toBe('RECUP DRAPEAU');
  });

  it('rien à retirer : RECUP', () => {
    expect(buildRemovalNotes(empty, null)).toBe('RECUP');
  });
});
