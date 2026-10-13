import { describe, expect, it } from 'vitest';
import {
  createAddonEntry, createEmptyInstallationForm, createEmptyPlacement, createFrameUnit, createInstallationSchema,
  toInstallationFormValues,
  type AddonEntryFormValues, type FrameUnitFormValues, type InstallationFormValues, type InstallationSchema,
} from './installation.schema';

/* ---------- Helpers ---------- */

const memberSchema = createInstallationSchema({ isMember: true, accountName: 'Jean Tremblay' });
const guestSchema = createInstallationSchema({ isMember: false, accountName: null });

const frame = (overrides: Partial<FrameUnitFormValues> = {}): FrameUnitFormValues => ({
  ...createFrameUnit(),
  model: 'regular',
  useAccountName: true,
  placement: { ...createEmptyPlacement(), location: 'ground' },
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
      placement: { location: 'ground' },
    });
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

describe('createInstallationSchema — emplacement', () => {
  const withPlacement = (placement: Partial<FrameUnitFormValues['placement']>) =>
    form({
      frames: {
        pickup: false,
        pickupAddress: '',
        units: [frame({ placement: { ...createEmptyPlacement(), ...placement } })],
      },
    });

  it('au mur : refuse le rendez-vous et exige la fixation', () => {
    const paths = issuePaths(memberSchema.safeParse(withPlacement({ location: 'wall', access: 'phoneAppointment' })));
    expect(paths).toEqual(expect.arrayContaining([
      'frames.units.0.placement.access',
      'frames.units.0.placement.mounting',
    ]));
  });

  it('clôture + rendez-vous : exige les coordonnées et produit le bon objet', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'fence', access: 'phoneAppointment' }))))
      .toContain('frames.units.0.placement.contact');

    const result = memberSchema.safeParse(
      withPlacement({ location: 'fence', access: 'phoneAppointment', contact: '514-555-0000' }),
    );
    expect(result.success && result.data.frames?.units[0].placement).toEqual({
      location: 'fence',
      access: { type: 'phoneAppointment', contact: '514-555-0000' },
    });
  });

  it('autres : exige une description', () => {
    expect(issuePaths(memberSchema.safeParse(withPlacement({ location: 'other' }))))
      .toContain('frames.units.0.placement.description');
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
});

describe('toInstallationFormValues — aller-retour', () => {
  /** formulaire → domaine → formulaire → domaine : les deux objets du domaine doivent être identiques */
  const expectRoundTrip = (schema: InstallationSchema, values: InstallationFormValues) => {
    const first = schema.parse(values);
    const second = schema.parse(toInstallationFormValues(first));
    expect(second).toEqual(first);
  };

  it('membre : toutes les variantes de modèle, nom et emplacement', () => {
    const units = [
      frame({ model: 'custom', modelDescription: 'Pancarte bleue', useAccountName: false, displayName: 'A. et B. Roy' }),
      frame({ placement: { ...createEmptyPlacement(), location: 'wall', access: 'smallLadder', mounting: 'vShapeDrilled' } }),
      frame({ model: 'prestige', placement: { ...createEmptyPlacement(), location: 'balcony', access: 'phoneAppointment', contact: '514-555-0000' } }),
    ];

    expectRoundTrip(memberSchema, form({
      materials: ['frames', 'addons'],
      frames: { pickup: false, pickupAddress: '', units },
      addons: [
        { ...createAddonEntry('other'), mention: 'Vue sur le fleuve', quantity: 1, frameUids: [units[0].uid], onSite: false },
        { ...createAddonEntry('secondFloor'), quantity: 3, frameUids: [units[1].uid, units[2].uid], onSite: true },
      ],
    }));
  });

  it('membre : emplacements simples et « autres »', () => {
    expectRoundTrip(memberSchema, form({
      frames: {
        pickup: false,
        pickupAddress: '',
        units: [
          frame({ placement: { ...createEmptyPlacement(), location: 'ramp' } }),
          frame({ placement: { ...createEmptyPlacement(), location: 'fence', access: 'noLadder' } }),
          frame({ placement: { ...createEmptyPlacement(), location: 'other', description: 'Derrière la haie' } }),
        ],
      },
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
});