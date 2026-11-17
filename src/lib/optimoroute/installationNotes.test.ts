import { describe, expect, it } from 'vitest';
import type { FrameUnit, InstallationDetails, Placement } from '@/features/services/types/installation';
import { buildInstallationNotes, buildOpenHouseRemovalNotes } from './installationNotes';

const ACCOUNT = 'Natasha Fournier';

const empty: InstallationDetails = {
  pickupAddress: null, frames: null, kits: null, addons: null, openHouse: null, keybox: null, flags: null, directionals: null, otherNeeds: null,
};

const frame = (uid: string, o: Partial<FrameUnit> = {}): FrameUnit => ({
  uid,
  model: { type: 'regular' },
  displayName: { type: 'account', name: ACCOUNT },
  placement: { location: 'ground' },
  ...o,
});

const frames = (...units: FrameUnit[]) => ({ units });

const window: Placement = {
  location: 'window', side: 'interior', access: { type: 'phoneAppointment', contact: '514-123-4567' },
};

describe('buildInstallationNotes — exemples de la nomenclature', () => {
  it('nom affiché différent, ajout perso, boîte à clés, directionnelle', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(frame('f1', { displayName: { type: 'custom', names: 'Stephany' } })),
      addons: [{ addon: 'customNoMention', details: null, quantity: 1, frameUids: ['f1'], onSiteCount: 0, placements: null }],
      keybox: { code: '1234', placement: 'Sur la rampe' },
      directionals: { mention: 'forSale', units: [{ uid: 'd1', placement: 'Ste Catherine et St-Pierre' }] },
    }, ACCOUNT);
    expect(notes).toBe(
      'KIT STEPHANY (NATASHA FOURNIER) + AJOUT PERSO **AU SOL** + BAC1234 (SUR LA RAMPE) + DIRECTIONNELLE **À VENDRE** [Ste Catherine et St-Pierre]',
    );
  });

  it('Prestige sur rampe avec deux ajouts', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(frame('f1', { model: { type: 'prestige' }, placement: { location: 'ramp' } })),
      addons: [
        { addon: 'forSale', quantity: 1, frameUids: ['f1'], onSiteCount: 0, placements: null },
        { addon: 'groundFloor', quantity: 1, frameUids: ['f1'], onSiteCount: 0, placements: null },
      ],
    }, ACCOUNT);
    expect(notes).toBe('KIT NATASHA FOURNIER **PRESTIGE** + AJOUT À VENDRE + AJOUT REZ-DE-CHAUSSÉE **SUR RAMPE**');
  });

  it('fenêtre intérieure avec rendez-vous', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(
        frame('f1', { displayName: { type: 'custom', names: 'Cristian' }, placement: window }),
        frame('f2', { displayName: { type: 'custom', names: 'William' }, placement: window }),
      ),
    }, null);
    expect(notes).toBe(
      'KIT CRISTIAN **FENÊTRE INTÉRIEUR AVEC RDV** (514-123-4567) + KIT WILLIAM **FENÊTRE INTÉRIEUR AVEC RDV** (514-123-4567)',
    );
  });

  it('pancartes identiques regroupées : 2x KIT … + 2x AJOUT …', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(
        frame('f1', { placement: { location: 'ramp' } }),
        frame('f2', { placement: { location: 'ramp' } }),
      ),
      addons: [{ addon: 'sold', model: { type: 'regular' }, quantity: 2, frameUids: ['f1', 'f2'], onSiteCount: 0, placements: null }],
    }, ACCOUNT);
    expect(notes).toBe('2x KIT NATASHA FOURNIER + 2x AJOUT VENDU **SUR RAMPE**');
  });

  it('ajout sur une pancarte déjà sur place : nombre d\'unités et mention', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(frame('f1', { displayName: { type: 'custom', names: 'Stephany' } })),
      addons: [
        { addon: 'forSale', quantity: 1, frameUids: ['f1'], onSiteCount: 0, placements: null },
        { addon: 'secondFloor', quantity: 2, frameUids: ['f1'], onSiteCount: 1, placements: null },
      ],
    }, ACCOUNT);
    expect(notes).toBe(
      'KIT STEPHANY (NATASHA FOURNIER) + AJOUT À VENDRE + AJOUT 2e ÉTAGE **AU SOL** + 1x AJOUT 2e ÉTAGE [PANCARTE DÉJÀ SUR PLACE]',
    );
  });

  it('visite libre : ajout « VISITE LIBRE » sur la pancarte et sur une pancarte déjà sur place', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(frame('f1')),
      openHouse: {
        quantity: 3, frameUids: ['f1'], onSiteCount: 2, placements: null,
        dates: ['2026-11-21'], startTime: '14:00', endTime: '16:00', directionals: [], flagCount: 0, removeNextMonday: false,
      },
    }, ACCOUNT);
    expect(notes).toBe(
      'KIT NATASHA FOURNIER + AJOUT VISITE LIBRE SAMEDI 14h00-16h00 **AU SOL** + 2x AJOUT VISITE LIBRE SAMEDI 14h00-16h00 [PANCARTE DÉJÀ SUR PLACE]',
    );
  });

  it('ajouts sans pancarte commandée : nom du compte après le premier, au sol affiché', () => {
    const onSite = { frameUids: [], placements: [{ location: 'ground' as const }] };
    const notes = buildInstallationNotes({
      ...empty,
      addons: [
        { addon: 'forSale', quantity: 1, onSiteCount: 1, ...onSite },
        { addon: 'groundFloor', quantity: 1, onSiteCount: 1, ...onSite },
        { addon: 'secondFloor', quantity: 1, onSiteCount: 1, ...onSite },
      ],
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('AJOUT À VENDRE CRISTIAN FERMIN LOPEZ **AU SOL** + AJOUT REZ-DE-CHAUSSÉE **AU SOL** + AJOUT 2e ÉTAGE **AU SOL**');
  });

  it('ajouts sans pancarte commandée : quantité à partir de 2, emplacements', () => {
    const notes = buildInstallationNotes({
      ...empty,
      addons: [{ addon: 'sold', model: { type: 'regular' }, quantity: 2, frameUids: [], onSiteCount: 2, placements: [{ location: 'ramp' }] }],
    }, ACCOUNT);
    expect(notes).toBe('2x AJOUT VENDU NATASHA FOURNIER **SUR RAMPE**');
  });

  it.each([
    [{ location: 'wall', ladder: 'smallLadder', mounting: 'vShapeDrilled' }, '**MUR AVEC ÉCHELLE 6-12 PI - EN V**'],
    [{ location: 'wall', ladder: 'noLadder', mounting: 'flatDoubleTape' }, '**MUR - À PLAT**'],
    [
      { location: 'balcony', access: { type: 'keybox', info: 'code 4821' }, mounting: 'flatDoubleTape' },
      '**BALCON VIA BAC - À PLAT** (code 4821)',
    ],
    [{ location: 'balcony', access: { type: 'ladder', ladder: 'bigLadder' }, mounting: null }, '**BALCON AVEC ÉCHELLE 13-24 PI**'],
    [
      { location: 'window', side: 'exterior', access: { type: 'ladder', ladder: 'smallLadder' } },
      '**FENÊTRE EXTÉRIEUR AVEC ÉCHELLE 6-12 PI**',
    ],
    [{ location: 'other', description: 'Derrière la haie' }, '[Derrière la haie]'],
  ] satisfies [Placement, string][])('emplacement %o', (placement, expected) => {
    const notes = buildInstallationNotes({ ...empty, frames: frames(frame('f1', { placement })) }, ACCOUNT);
    expect(notes).toBe(`KIT NATASHA FOURNIER ${expected}`);
  });

  it('kit seul : POTEAU {MODÈLE} {COMPTE}, au sol', () => {
    const notes = buildInstallationNotes({
      ...empty,
      kits: { units: [{ uid: 'k1', model: { type: 'shortPost36' }, placement: { location: 'ground' } }] },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('POTEAU 36" CRISTIAN FERMIN LOPEZ **AU SOL**');
  });

  it('kit spécifique : description entre parenthèses, « Autres » entre crochets ; fenêtre ignorée', () => {
    const notes = buildInstallationNotes({
      ...empty,
      kits: {
        units: [
          { uid: 'k1', model: { type: 'custom', description: 'Noir étoilé' }, placement: { location: 'other', description: 'Ce kit va 6 pieds sous terre' } },
          { uid: 'k2', model: { type: 'longPost48' }, placement: window },
          { uid: 'k3', model: { type: 'longPost48' }, placement: window },
        ],
      },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe(
      'POTEAU SPÉCIFIQUE CRISTIAN FERMIN LOPEZ (Noir étoilé) [Ce kit va 6 pieds sous terre] + 2x POTEAU 48"',
    );
  });

  describe('visite libre sans pancarte, avec retrait le lundi', () => {
    const openHouse: InstallationDetails = {
      ...empty,
      openHouse: {
        quantity: 2,
        frameUids: [],
        onSiteCount: 2,
        placements: [{ location: 'balcony', access: { type: 'keybox', info: '12344' }, mounting: null }],
        dates: ['2026-11-18'],
        startTime: '14:15',
        endTime: '16:15',
        directionals: [
          { uid: 'd1', placement: 'Newman et léger' },
          { uid: 'd2', placement: 'Léger et Newman' },
          { uid: 'd3', placement: '' },
          { uid: 'd4', placement: 'Jean Talon et St-Michel' },
          { uid: 'd5', placement: '' },
        ],
        flagCount: 2,
        removeNextMonday: true,
      },
    };

    it('note de l\'installation : jour, heures, compte, emplacement, directionnelles', () => {
      expect(buildInstallationNotes(openHouse, 'Cristian Fermin Lopez')).toBe(
        '2x AJOUT VISITE LIBRE MERCREDI 14h15-16h15 CRISTIAN FERMIN LOPEZ **BALCON VIA BAC** (12344) '
        + '+ 5x DIRECTIONNELLES [Newman et léger / Léger et Newman / ... / Jean Talon et St-Michel / ...]',
      );
    });

    it('note du retrait du lundi : RECUP, sans jour ni heure', () => {
      expect(buildOpenHouseRemovalNotes(openHouse, 'Cristian Fermin Lopez')).toBe(
        '2x RECUP AJOUT VISITE LIBRE CRISTIAN FERMIN LOPEZ **BALCON VIA BAC** (12344) '
        + '+ 5x RECUP DIRECTIONNELLES [Newman et léger / Léger et Newman / ... / Jean Talon et St-Michel / ...]',
      );
    });

    it('pas de retrait demandé : pas de note du lundi', () => {
      expect(buildOpenHouseRemovalNotes(
        { ...openHouse, openHouse: openHouse.openHouse && { ...openHouse.openHouse, removeNextMonday: false } },
        null,
      )).toBeNull();
    });
  });

  it('nom du compte une seule fois : seulement sur la première pancarte', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(
        frame('f1', { displayName: { type: 'custom', names: 'Cristian' }, placement: window }),
        frame('f2', { displayName: { type: 'custom', names: 'William' }, placement: window }),
      ),
    }, ACCOUNT);
    expect(notes).toBe(
      'KIT CRISTIAN (NATASHA FOURNIER) **FENÊTRE INTÉRIEUR AVEC RDV** (514-123-4567) + KIT WILLIAM **FENÊTRE INTÉRIEUR AVEC RDV** (514-123-4567)',
    );
  });

  it('drapeaux : mention « Autres », compte, emplacement tel que saisi', () => {
    const notes = buildInstallationNotes({
      ...empty,
      flags: { mention: 'other', customMention: 'Drapeaux du canada', quantity: 2, placement: 'Newman et léger' },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('2x DRAPEAU DRAPEAUX DU CANADA CRISTIAN FERMIN LOPEZ (Newman et léger)');
  });

  it('boîte à clés seule : BAC{CODE} {COMPTE}', () => {
    const notes = buildInstallationNotes({ ...empty, keybox: { code: '111111', placement: '' } }, 'Cristian Fermin Lopez');
    expect(notes).toBe('BAC111111 CRISTIAN FERMIN LOPEZ');
  });

  it('autres : MATÉRIEL {TEXTE} {COMPTE}', () => {
    const notes = buildInstallationNotes({ ...empty, otherNeeds: 'un precision tres precise' }, 'Cristian Fermin Lopez');
    expect(notes).toBe('MATÉRIEL UN PRECISION TRES PRECISE CRISTIAN FERMIN LOPEZ');
  });

  it('ordre des pancartes : rendez-vous, puis « Autres », puis boîte à clés', () => {
    const notes = buildInstallationNotes({
      ...empty,
      frames: frames(
        frame('f1', { placement: { location: 'window', side: 'exterior', access: { type: 'keybox', info: 'Le code est 1234' } } }),
        frame('f2', {
          model: { type: 'prestige' },
          placement: { location: 'balcony', access: { type: 'phoneAppointment', contact: '438 722 3922' }, mounting: 'vShapeDrilled' },
        }),
        frame('f3', { model: { type: 'custom', description: 'iPhone' }, placement: { location: 'other', description: 'La pancarte se trouve dans le ciel' } }),
        frame('f4'),
      ),
    }, ACCOUNT);
    expect(notes).toBe(
      'KIT NATASHA FOURNIER **PRESTIGE** **BALCON AVEC RDV - EN V** (438 722 3922) '
      + '+ KIT NATASHA FOURNIER **IPHONE** [La pancarte se trouve dans le ciel] '
      + '+ KIT NATASHA FOURNIER **AU SOL** '
      + '+ KIT NATASHA FOURNIER **FENÊTRE EXTÉRIEUR VIA BAC** (Le code est 1234)',
    );
  });

  it('plusieurs directionnelles : quantité et emplacements', () => {
    const notes = buildInstallationNotes({
      ...empty,
      directionals: { mention: 'sold', units: [{ uid: 'd1', placement: 'Coin A' }, { uid: 'd2', placement: 'Coin B' }] },
    }, ACCOUNT);
    expect(notes).toBe('2x DIRECTIONNELLES **VENDU** NATASHA FOURNIER [Coin A / Coin B]');
  });

  it('directionnelles : emplacement vide « ... », ordre conservé', () => {
    const notes = buildInstallationNotes({
      ...empty,
      directionals: {
        mention: 'forRent',
        units: [
          { uid: 'd1', placement: 'Neman et Léger' },
          { uid: 'd2', placement: 'Léger et Newman' },
          { uid: 'd3', placement: '' },
        ],
      },
    }, 'Cristian Fermin Lopez');
    expect(notes).toBe('3x DIRECTIONNELLES **À LOUER** CRISTIAN FERMIN LOPEZ [Neman et Léger / Léger et Newman / ...]');
  });

  it('directionnelles sans aucun emplacement : pas de crochets', () => {
    const notes = buildInstallationNotes({
      ...empty,
      directionals: { mention: 'sold', units: [{ uid: 'd1', placement: '' }] },
    }, null);
    expect(notes).toBe('DIRECTIONNELLE **VENDU**');
  });
});
