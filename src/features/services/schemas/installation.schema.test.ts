import { describe, expect, it } from 'vitest';
import {
  createAddonEntry, createDirectional, createEmptyInstallationForm, createEmptyOpenHouse, createEmptyPlacement, createFrameUnit, createInstallationSchema,
  createKitUnit,
  createPlacedUnit,
  KitUnitFormValues,
  OpenHouseFormValues,
  toInstallationFormValues,
  type AddonEntryFormValues, type FrameUnitFormValues, type InstallationFormValues, type InstallationSchema,
} from './installation.schema';
import { expectReadable } from './expectReadable.testUtils';

/* ---------- Helpers ---------- */

const memberSchema = createInstallationSchema({ isMember: true, accountName: 'Jean Tremblay' });
const guestSchema = createInstallationSchema({ isMember: false, accountName: null });

const frame = (overrides: Partial<FrameUnitFormValues> = {}): FrameUnitFormValues => ({
  ...createFrameUnit(),
  model: 'regular',
  useAccountName: true,
  ...overrides,
});

const form = (overrides: Partial<InstallationFormValues> = {}): InstallationFormValues => ({
  ...createEmptyInstallationForm(),
  materials: ['frames'],
  frames: { pickup: false, pickupAddress: '', units: [frame()] },
  ...overrides,
});

/** Chemins des erreurs, ex. "frames.units.0.model" */
const issuePaths = (result: ReturnType<InstallationSchema['safeParse']>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

/* ---------- Tests ---------- */

describe('createInstallationSchema — général', () => {
  it('exige au moins un matériel', () => {
    const result = memberSchema.safeParse(form({ materials: [] }));
    expect(issuePaths(result)).toContain('materials');
  });
});

describe('createInstallationSchema — pancartes (membre)', () => {
  it('produit un objet de domaine valide', () => {
    const result = memberSchema.safeParse(form());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.frames?.units[0]).toMatchObject({
      model: { type: 'regular' },
      displayName: { type: 'account', name: 'Jean Tremblay' },
    });
    expect(result.data.frames?.units[0].placement).toEqual({ location: 'ground' });
    expect(result.data.addons).toBeNull();
  });

  it('exige le modèle et la réponse sur le nom', () => {
    const result = memberSchema.safeParse(form({
      frames: { pickup: false, pickupAddress: '', units: [frame({ model: null, useAccountName: null })] },
    }));
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(['frames.units.0.model', 'frames.units.0.useAccountName']),
    );
  });

  it('exige la description d\'un modèle particulier', () => {
    const result = memberSchema.safeParse(form({
      frames: { pickup: false, pickupAddress: '', units: [frame({ model: 'custom' })] },
    }));
    expect(issuePaths(result)).toContain('frames.units.0.modelDescription');
  });

  it('ignore la question du ramassage', () => {
    const result = memberSchema.safeParse(form({ frames: { pickup: null, pickupAddress: '', units: [frame()] } }));
    expect(result.success).toBe(true);
  });
});

describe('createInstallationSchema — pancartes (non-membre)', () => {
  it('ne demande ni modèle ni nom, et les met à null', () => {
    const result = guestSchema.safeParse(form({
      frames: { pickup: false, pickupAddress: '', units: [frame({ model: null, useAccountName: null })] },
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.frames?.units[0]).toMatchObject({ model: null, displayName: null });
  });

  it('exige une réponse au ramassage, puis l\'adresse si Oui', () => {
    expect(issuePaths(guestSchema.safeParse(form({
      frames: { pickup: null, pickupAddress: '', units: [frame()] },
    })))).toContain('frames.pickup');

    expect(issuePaths(guestSchema.safeParse(form({
      frames: { pickup: true, pickupAddress: '   ', units: [frame()] }, // espaces seulement → vide après trim
    })))).toContain('frames.pickupAddress');
  });
});

describe('createInstallationSchema — emplacement par pancarte', () => {
  const P = 'frames.units.0.placement';
  const withPlacement = (placement: Partial<FrameUnitFormValues['placement']>) =>
    form({ frames: { pickup: false, pickupAddress: '', units: [frame({ placement: { ...createEmptyPlacement(), ...placement } })] } });

  it('exige un emplacement pour chaque pancarte', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: null })))).toContain(`${P}.location`);
  });

  it('ne valide pas les pancartes sans matériel', () => {
    const paths = issuePaths(memberSchema.safeParse({ ...withPlacement({ location: null }), materials: [] }));
    expect(paths).toEqual(['materials']);
  });

  it('au mur : refuse le rendez-vous et exige la fixation', () => {
    const paths = issuePaths(memberSchema.safeParse(withPlacement({ location: 'wall', access: 'phoneAppointment' })));
    expect(paths).toEqual(expect.arrayContaining([`${P}.access`, `${P}.mounting`]));
  });

  it('fenêtre + rendez-vous : exige les coordonnées et produit le bon objet', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'window', access: 'phoneAppointment' }))))
      .toContain(`${P}.contact`);

    const result = memberSchema.safeParse(
      withPlacement({ location: 'window', access: 'phoneAppointment', contact: '514-555-0000', windowSide: 'interior' }),
    );
    expect(result.success && result.data.frames?.units[0].placement).toEqual({
      location: 'window',
      access: { type: 'phoneAppointment', contact: '514-555-0000' },
      side: 'interior',
    });
  });

  it('fenêtre : exige le côté (intérieur / extérieur)', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'window', access: 'noLadder' }))))
      .toContain(`${P}.windowSide`);
  });

  it('autres : exige une description', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'other' })))).toContain(`${P}.description`);
  });

  it('accès par boîte à clés : exige les informations', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'balcony', access: 'keybox' }))))
      .toContain(`${P}.keyboxInfo`);
  });

  it('au mur : refuse la boîte à clés', () => {
    expect(issuePaths(memberSchema.safeParse(
      withPlacement({ location: 'wall', access: 'keybox', mounting: 'vShapeDrilled' }),
    ))).toContain(`${P}.access`);
  });

  it('kit seul : un emplacement par kit', () => {
    const kit = { ...createKitUnit(), model: 'shortPost36' as const, placement: createEmptyPlacement() };
    expect(issuePaths(memberSchema.safeParse(form({ materials: ['kit'], kits: { units: [kit] } }))))
      .toContain('kits.units.0.placement.location');
  });
});

describe('createInstallationSchema — emplacements des ajouts sans pancarte', () => {
  const addonsOnly = (entry: Partial<AddonEntryFormValues>) =>
    form({ materials: ['addons'], addons: [{ ...createAddonEntry('forSale'), onSite: true, ...entry }] });
  const ground = { ...createEmptyPlacement(), location: 'ground' as const };
  const ramp = { ...createEmptyPlacement(), location: 'ramp' as const };

  it('« Au sol » par défaut, enregistré sur l\'ajout', () => {
    const result = memberSchema.safeParse(addonsOnly({}));
    expect(result.success && result.data.addons?.[0].placements).toEqual([{ location: 'ground' }]);
  });

  it('exige au moins un emplacement, au plus un par unité, sans doublon', () => {
    expect(issuePaths(memberSchema.safeParse(addonsOnly({ placements: [] })))).toContain('addons.0.placements');
    expect(issuePaths(memberSchema.safeParse(addonsOnly({ quantity: 1, placements: [ground, ramp] }))))
      .toContain('addons.0.placements');
    expect(issuePaths(memberSchema.safeParse(addonsOnly({ quantity: 3, placements: [ground, ground] }))))
      .toContain('addons.0.placements');
  });

  it('accepte moins d\'emplacements que d\'unités (répartis par l\'équipe)', () => {
    const result = memberSchema.safeParse(addonsOnly({ quantity: 3, placements: [ground, ramp] }));
    expect(result.success && result.data.addons?.[0].placements).toEqual([{ location: 'ground' }, { location: 'ramp' }]);
  });

  it('avec des pancartes : aucun emplacement propre (null), même invalide', () => {
    const unit = frame();
    const result = memberSchema.safeParse(form({
      materials: ['frames', 'addons'],
      frames: { pickup: false, pickupAddress: '', units: [unit] },
      addons: [{ ...createAddonEntry('forSale'), frameUids: [unit.uid], placements: [] }],
    }));
    expect(result.success && result.data.addons?.[0].placements).toBeNull();
  });
});

describe('createInstallationSchema — ajouts', () => {
  const unit = frame(); // une pancarte au uid connu, ciblable par les ajouts

  const withAddons = (addons: AddonEntryFormValues[], withFrames = true) =>
    form({
      materials: withFrames ? ['frames', 'addons'] : ['addons'],
      frames: withFrames
        ? { pickup: false, pickupAddress: '', units: [unit] }
        : createEmptyInstallationForm().frames,
      addons,
    });

  const addon = (overrides: Partial<AddonEntryFormValues> = {}): AddonEntryFormValues => ({
    ...createAddonEntry('secondFloor'),
    onSite: true,
    ...overrides,
  });

  it('exige au moins un ajout', () => {
    expect(issuePaths(memberSchema.safeParse(withAddons([])))).toContain('addons');
  });

  it('refuse plus de 3 ajouts et les doublons', () => {
    const four = (['forSale', 'sold', 'duplex', 'condo'] as const).map((key) => addon({ addon: key }));
    expect(issuePaths(memberSchema.safeParse(withAddons(four)))).toContain('addons');
    expect(issuePaths(memberSchema.safeParse(withAddons([addon(), addon()])))).toContain('addons');
  });

  it('« Autres » exige une mention', () => {
    expect(issuePaths(memberSchema.safeParse(withAddons([addon({ addon: 'other' })]))))
      .toContain('addons.0.mention');
  });

  it('répartition : toutes les unités doivent être affectées', () => {
    const result = memberSchema.safeParse(withAddons([
      addon({ quantity: 2, frameUids: [unit.uid], onSite: false }),
    ]));
    expect(issuePaths(result)).toContain('addons.0.frameUids');
  });

  it('répartition : « sur place » exige au moins une unité restante', () => {
    const result = memberSchema.safeParse(withAddons([
      addon({ quantity: 1, frameUids: [unit.uid], onSite: true }),
    ]));
    expect(issuePaths(result)).toContain('addons.0.onSite');
  });

  it('répartition valide : calcule onSiteCount', () => {
    const result = memberSchema.safeParse(withAddons([
      addon({ quantity: 3, frameUids: [unit.uid], onSite: true }),
    ]));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.addons?.[0]).toEqual({
      addon: 'secondFloor',
      quantity: 3,
      frameUids: [unit.uid],
      onSiteCount: 2,
      // Pancartes commandées : l'ajout va sur elles, sans emplacement propre
      placements: null,
    });
  });

  it('refuse une pancarte cible inexistante (pancartes non sélectionnées)', () => {
    const result = memberSchema.safeParse(withAddons(
      [addon({ quantity: 1, frameUids: [unit.uid], onSite: false })],
      false,
    ));
    expect(issuePaths(result)).toContain('addons.0.frameUids');
  });

  it('ajouts seuls : « sur place » suffit et frames vaut null', () => {
    const result = memberSchema.safeParse(withAddons([addon({ quantity: 2 })], false));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.frames).toBeNull();
    expect(result.data.addons?.[0]).toMatchObject({ frameUids: [], onSiteCount: 2 });
  });

  it('ajout personnalisé : précisions facultatives', () => {
    const empty = memberSchema.safeParse(withAddons([addon({ addon: 'customNoMention' })]));
    expect(empty.success && empty.data.addons?.[0]).toMatchObject({ addon: 'customNoMention', details: null });

    const filled = memberSchema.safeParse(withAddons([addon({ addon: 'customNoMention', mention: 'Logo de l’agence' })]));
    expect(filled.success && filled.data.addons?.[0]).toMatchObject({ details: 'Logo de l’agence' });
  });

  it('« Vendu » : Régulier par défaut, description exigée pour un modèle particulier', () => {
    const regular = memberSchema.safeParse(withAddons([addon({ addon: 'sold' })]));
    expect(regular.success && regular.data.addons?.[0]).toMatchObject({ addon: 'sold', model: { type: 'regular' } });

    expect(issuePaths(memberSchema.safeParse(withAddons([addon({ addon: 'sold', model: 'custom' })]))))
      .toContain('addons.0.modelDescription');
  });

  it('les autres ajouts n\'ont pas de modèle', () => {
    const result = memberSchema.safeParse(withAddons([addon({ addon: 'secondFloor', model: 'prestige' })]));
    expect(result.success && result.data.addons?.[0]).not.toHaveProperty('model');
  });
});

describe('createInstallationSchema — kit seul', () => {
  const kit = (overrides: Partial<KitUnitFormValues> = {}): KitUnitFormValues => ({
    ...createKitUnit(),
    model: 'shortPost36',
    ...overrides,
  });

  const withKits = (units: KitUnitFormValues[], materials: InstallationFormValues['materials'] = ['kit']) =>
    form({ materials, frames: createEmptyInstallationForm().frames, kits: { units } });

  it('produit un objet de domaine valide', () => {
    const result = memberSchema.safeParse(withKits([kit()]));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.kits?.units[0].model).toEqual({ type: 'shortPost36' });
    expect(result.data.frames).toBeNull();
  });

  it('exige au moins un kit, et un modèle pour chacun', () => {
    expect(issuePaths(memberSchema.safeParse(withKits([])))).toContain('kits.units');
    expect(issuePaths(memberSchema.safeParse(withKits([kit({ model: null })])))).toContain('kits.units.0.model');
  });

  it('poteau spécifique : exige une description', () => {
    expect(issuePaths(memberSchema.safeParse(withKits([kit({ model: 'custom' })]))))
      .toContain('kits.units.0.description');
  });

  it('avec des pancartes : le kit est inclus, ses détails sont ignorés', () => {
    const result = memberSchema.safeParse(form({
      materials: ['frames', 'kit'],
      kits: { units: [kit({ model: null })] }, // invalide, mais ignoré
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.kits).toBeNull();
  });
});

describe('createInstallationSchema — visite libre', () => {
  const openHouse = (overrides: Partial<OpenHouseFormValues> = {}): OpenHouseFormValues => ({
    ...createEmptyOpenHouse(),
    onSite: true,
    dates: ['2026-10-24'],
    removeNextMonday: true,
    ...overrides,
  });

  const withOpenHouse = (overrides: Partial<OpenHouseFormValues> = {}) =>
    form({ materials: ['openHouse'], frames: createEmptyInstallationForm().frames, openHouse: openHouse(overrides) });

  it('produit un objet de domaine valide (fin par défaut = début + 2 h)', () => {
    const result = memberSchema.safeParse(withOpenHouse());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.openHouse).toMatchObject({
      dates: ['2026-10-24'],
      startTime: '09:00',
      endTime: '11:00',
      onSiteCount: 1,
      flagCount: 0,
      removeNextMonday: true,
    });
  });

  it('exige une date valide et la réponse au retrait', () => {
    const paths = issuePaths(memberSchema.safeParse(withOpenHouse({ dates: [], removeNextMonday: null })));
    expect(paths).toEqual(expect.arrayContaining(['openHouse.dates', 'openHouse.removeNextMonday']));
  });

  it('refuse une heure de fin qui n\'est pas après le début', () => {
    expect(issuePaths(memberSchema.safeParse(withOpenHouse({ startTime: '14:00', endTime: '14:00' }))))
      .toContain('openHouse.endTime');
  });

  it('emplacement des directionnelles facultatif', () => {
    expect(memberSchema.safeParse(withOpenHouse({ directionals: [createDirectional()] })).success).toBe(true);
  });

  it('applique les règles de répartition des ajouts', () => {
    expect(issuePaths(memberSchema.safeParse(withOpenHouse({ onSite: false }))))
      .toContain('openHouse.frameUids');
  });

  it('deux dates : exige exactement deux dates, triées dans le domaine', () => {
    expect(issuePaths(memberSchema.safeParse(withOpenHouse({ twoDates: true, dates: ['2026-10-24'] }))))
      .toContain('openHouse.dates');

    const result = memberSchema.safeParse(withOpenHouse({ twoDates: true, dates: ['2026-10-25', '2026-10-24'] }));
    expect(result.success && result.data.openHouse?.dates).toEqual(['2026-10-24', '2026-10-25']);
  });

  it('deux dates : doivent être consécutives', () => {
    expect(issuePaths(memberSchema.safeParse(withOpenHouse({ twoDates: true, dates: ['2026-10-24', '2026-10-26'] }))))
      .toContain('openHouse.dates');
  });
});

describe('createInstallationSchema — boîte à clés, drapeaux, directionnelles, autres', () => {
  const placed = (placement = 'À côté de la porte') => ({ ...createPlacedUnit(), placement });
  const only = (materials: InstallationFormValues['materials'], overrides: Partial<InstallationFormValues> = {}) =>
    form({ materials, frames: createEmptyInstallationForm().frames, ...overrides });

  it('boîte à clés : un code et un emplacement', () => {
    const result = memberSchema.safeParse(only(['keybox'], { keybox: { code: '1234', placement: 'Garage' } }));
    expect(result.success && result.data.keybox).toEqual({ code: '1234', placement: 'Garage' });
  });

  it('boîte à clés : code requis, 6 chiffres maximum, chiffres seulement', () => {
    const codeError = (code: string) =>
      issuePaths(memberSchema.safeParse(only(['keybox'], { keybox: { code, placement: '' } })));
    expect(codeError('')).toContain('keybox.code');
    expect(codeError('1234567')).toContain('keybox.code');
    expect(codeError('12a4')).toContain('keybox.code');
  });

  it('boîte à clés : emplacement facultatif', () => {
    expect(memberSchema.safeParse(only(['keybox'], { keybox: { code: '1234', placement: '' } })).success).toBe(true);
  });

  it('drapeaux : mention requise, 2 maximum', () => {
    expect(issuePaths(memberSchema.safeParse(only(['flags'])))).toContain('flags.mention');
    expect(issuePaths(memberSchema.safeParse(only(['flags'], { flags: { mention: 'sold', customMention: '', quantity: 3, placement: '' } }))))
      .toContain('flags.quantity');
  });

  it('drapeaux : « Autres » exige une mention', () => {
    expect(issuePaths(memberSchema.safeParse(only(['flags'], {
      flags: { mention: 'other', customMention: '', quantity: 1, placement: '' },
    })))).toContain('flags.customMention');
  });

  it('directionnelles : mention requise, emplacement facultatif', () => {
    const paths = issuePaths(memberSchema.safeParse(only(['directional'], {
      directionals: { mention: null, units: [placed('')] },
    })));
    expect(paths).toEqual(['directionals.mention']);
  });

  it('autres : description requise', () => {
    expect(issuePaths(memberSchema.safeParse(only(['other'])))).toContain('otherNeeds');
  });
});

describe('toInstallationFormValues — aller-retour', () => {
  const expectRoundTrip = (schema: InstallationSchema, values: InstallationFormValues) => {
    const first = schema.parse(values);
    const second = schema.parse(toInstallationFormValues(first));
    expect(second).toEqual(first);
    expectReadable('installation', schema, values);
  };

  it('membre : variantes de modèle, de nom et ajouts', () => {
    const units = [
      frame({ model: 'custom', modelDescription: 'Pancarte bleue', useAccountName: false, displayName: 'A. et B. Roy' }),
      frame({ model: 'prestige' }),
    ];

    expectRoundTrip(memberSchema, form({
      materials: ['frames', 'addons'],
      frames: { pickup: false, pickupAddress: '', units },
      addons: [
        { ...createAddonEntry('other'), mention: 'Vue sur le fleuve', quantity: 1, frameUids: [units[0].uid], onSite: false },
        { ...createAddonEntry('secondFloor'), quantity: 3, frameUids: [units[1].uid], onSite: true },
        { ...createAddonEntry('customNoMention'), mention: 'Logo de l’agence', quantity: 1, onSite: true },
      ],
    }));
  });

  // Chaque variante d'emplacement doit survivre à l'aller-retour
  it.each([
    { location: 'ground' },
    { location: 'ramp' },
    { location: 'wall', access: 'smallLadder', mounting: 'vShapeDrilled' },
    { location: 'window', access: 'noLadder', windowSide: 'exterior' },
    { location: 'window', access: 'keybox', keyboxInfo: 'Code 4821, porte', windowSide: 'interior' },
    { location: 'other', description: 'Derrière la haie' },
  ] satisfies Partial<FrameUnitFormValues['placement']>[])('emplacement $location ($access)', (placement) => {
    expectRoundTrip(memberSchema, form({
      frames: { pickup: false, pickupAddress: '', units: [frame({ placement: { ...createEmptyPlacement(), ...placement } })] },
    }));
  });

  it('non-membre : ramassage conservé', () => {
    expectRoundTrip(guestSchema, form({
      frames: {
        pickup: true,
        pickupAddress: '123 rue Principale, Montréal',
        units: [frame({ model: null, useAccountName: null })],
      },
    }));
  });

  it('ajouts seuls', () => {
    expectRoundTrip(memberSchema, form({
      materials: ['addons'],
      frames: createEmptyInstallationForm().frames,
      addons: [{ ...createAddonEntry('forSale'), quantity: 2, onSite: true }],
    }));
  });

  it('kit seul, dont un poteau spécifique', () => {
    expectRoundTrip(memberSchema, form({
      materials: ['kit'],
      frames: createEmptyInstallationForm().frames,
      kits: {
        units: [
          { ...createKitUnit(), model: 'colonialBlack' },
          { ...createKitUnit(), model: 'custom', description: 'Poteau vert 60"' },
        ],
      },
    }));
  });

  it('visite libre complète', () => {
    const unit = frame();
    expectRoundTrip(memberSchema, form({
      materials: ['frames', 'openHouse'],
      frames: { pickup: false, pickupAddress: '', units: [unit] },
      openHouse: {
        ...createEmptyOpenHouse(),
        quantity: 2,
        frameUids: [unit.uid],
        onSite: true,
        dates: ['2026-10-24', '2026-10-25'],
        twoDates: true,
        startTime: '13:30',
        endTime: '16:00',
        directionals: [{ ...createDirectional(), placement: 'Coin rue Principale' }],
        flagCount: 2,
        removeNextMonday: false,
      },
    }));
  });

  it('boîte à clés, drapeaux, directionnelles et autres', () => {
    expectRoundTrip(memberSchema, form({
      materials: ['keybox', 'flags', 'directional', 'other'],
      frames: createEmptyInstallationForm().frames,
      keybox: { code: '123456', placement: 'Porte arrière' },
      flags: { mention: 'other', customMention: 'Prix réduit', quantity: 2, placement: 'Sur la clôture' },
      directionals: {
        mention: 'forRent',
        units: [{ ...createPlacedUnit(), placement: 'Coin Principale' }, { ...createPlacedUnit(), placement: 'Sortie 12' }],
      },
      otherNeeds: 'Installer avant 10 h',
    }));
  });

  it('ajout « Vendu » avec modèle particulier', () => {
    expectRoundTrip(memberSchema, form({
      materials: ['addons'],
      frames: createEmptyInstallationForm().frames,
      addons: [{ ...createAddonEntry('sold'), model: 'custom', modelDescription: 'Lettres dorées', quantity: 2, onSite: true }],
    }));
  });
});