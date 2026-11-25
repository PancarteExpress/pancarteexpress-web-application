import { describe, expect, it } from 'vitest';
import { buildPickupNotes } from './pickupNotes';

describe('buildPickupNotes', () => {
  it('ton exemple : tous les matériels, détails avec majuscule', () => {
    const notes = buildPickupNotes({
      materials: ['other', 'frames', 'anchors', 'poles', 'addons', 'keybox', 'directional'],
      newModels: true,
      details: "changement d'informations, d'agence et tout ce qui est possible de changer",
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      'PICK UP CRISTIAN FERMIN LOPEZ [Pancartes, Ancrages, Poteaux, Ajouts, Boîtes à clés, Directionnelles, Autres '
      + "/ Changement d'informations, d'agence et tout ce qui est possible de changer]",
    );
  });

  it('sans détails ni compte', () => {
    expect(buildPickupNotes({ materials: ['frames', 'addons'], newModels: false, details: null }, null))
      .toBe('PICK UP [Pancartes, Ajouts]');
  });

  it('détails seuls, sans matériel coché : entre crochets', () => {
    expect(buildPickupNotes({ materials: [], newModels: false, details: 'blablabla' }, 'Natasha Fournier'))
      .toBe('PICK UP NATASHA FOURNIER [Blablabla]');
  });
});
