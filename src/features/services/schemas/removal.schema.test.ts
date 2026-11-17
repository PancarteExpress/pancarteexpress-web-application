import { describe, expect, it } from 'vitest';
import { createEmptyPlacement, type PlacementFormValues } from './placement.schema';
import {
  createRemovalSchema,
  createEmptyRemovalForm, createRemovalDirectional, createRemovalUnit, removalSchema, toRemovalFormValues,
  type RemovalFormValues, type RemovalUnitFormValues,
} from './removal.schema';

const issuePaths = (result: ReturnType<typeof removalSchema.safeParse>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

const unit = (placement: Partial<PlacementFormValues> = { location: 'ground' }): RemovalUnitFormValues => ({
  ...createRemovalUnit(),
  placement: { ...createEmptyPlacement(), ...placement },
});

const form = (units: RemovalUnitFormValues[]): RemovalFormValues => ({
  ...createEmptyRemovalForm(),
  materials: ['frames'],
  frames: { units },
});

describe('removalSchema', () => {
  it('exige au moins un élément à retirer', () => {
    expect(issuePaths(removalSchema.safeParse(createEmptyRemovalForm()))).toContain('materials');
  });

  it('exige au moins une pancarte', () => {
    expect(issuePaths(removalSchema.safeParse(form([])))).toContain('frames.units');
  });

  it('produit un emplacement par pancarte', () => {
    const result = removalSchema.safeParse(form([
      unit({ location: 'ground' }),
      unit({ location: 'wall', access: 'smallLadder', mounting: 'flatDoubleTape' }),
    ]));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.frames?.units.map((u) => u.placement)).toEqual([
      { location: 'ground' },
      { location: 'wall', ladder: 'smallLadder', mounting: 'flatDoubleTape' },
    ]);
  });

  it('valide chaque emplacement indépendamment', () => {
    const paths = issuePaths(removalSchema.safeParse(form([unit(), unit({ location: null })])));
    expect(paths).toEqual(['frames.units.1.placement.location']);
  });

  it('fenêtre : le côté est facultatif au retrait', () => {
    const paths = issuePaths(removalSchema.safeParse(form([unit({ location: 'window', access: 'noLadder' })])));
    expect(paths).not.toContain('frames.units.0.placement.windowSide');
  });

  it('fenêtre : les autres règles de l\'emplacement partagé s\'appliquent toujours (accès exigé)', () => {
    const paths = issuePaths(removalSchema.safeParse(form([unit({ location: 'window' })])));
    expect(paths).toContain('frames.units.0.placement.access');
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = removalSchema.parse(form([
      unit({ location: 'balcony', access: 'keybox', keyboxInfo: 'Code 4821', mounting: 'flatDoubleTape' }),
      unit({ location: 'window', access: 'phoneAppointment', contact: '514-555-0000', windowSide: 'exterior' }),
    ]));
    expect(removalSchema.parse(toRemovalFormValues(first))).toEqual(first);
  });
});

describe('removalSchema — ajouts', () => {
  const addonsForm = (units: RemovalUnitFormValues[], details = ''): RemovalFormValues => ({
    ...createEmptyRemovalForm(),
    materials: ['addons'],
    addons: { units, details },
  });

  it('précision facultative, un emplacement par ajout', () => {
    const result = removalSchema.safeParse(addonsForm([unit(), unit({ location: 'ramp' })]));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.frames).toBeNull();
    expect(result.data.addons).toEqual({
      units: [
        { uid: expect.any(String), placement: { location: 'ground' } },
        { uid: expect.any(String), placement: { location: 'ramp' } },
      ],
      details: null,
    });
  });

  it('valide l\'emplacement de chaque ajout', () => {
    expect(issuePaths(removalSchema.safeParse(addonsForm([unit({ location: null })]))))
      .toContain('addons.units.0.placement.location');
  });

  it('refuse pancartes et ajouts ensemble', () => {
    const result = removalSchema.safeParse({
      ...addonsForm([unit()]),
      materials: ['frames', 'addons'],
      frames: { units: [unit()] },
    });
    expect(issuePaths(result)).toContain('materials');
  });

  it('aller-retour avec précision', () => {
    const first = removalSchema.parse(addonsForm([unit({ location: 'window', access: 'noLadder', windowSide: 'interior' })], 'Le « Vendu »'));
    expect(removalSchema.parse(toRemovalFormValues(first))).toEqual(first);
  });
});

describe('removalSchema — boîtes à clés, drapeaux, directionnelles, autres', () => {
  const only = (materials: RemovalFormValues['materials'], overrides: Partial<RemovalFormValues> = {}): RemovalFormValues => ({
    ...createEmptyRemovalForm(),
    materials,
    ...overrides,
  });

  it('boîtes à clés : code requis (chiffres, 6 max), emplacement facultatif', () => {
    expect(issuePaths(removalSchema.safeParse(only(['keybox'])))).toEqual(['keybox.code']);
    expect(issuePaths(removalSchema.safeParse(only(['keybox'], { keybox: { quantity: 2, code: '12a', placement: '' } }))))
      .toContain('keybox.code');

    const result = removalSchema.safeParse(only(['keybox'], { keybox: { quantity: 2, code: '4821', placement: '' } }));
    expect(result.success && result.data.keybox).toEqual({ quantity: 2, code: '4821', placement: '' });
  });

  const flags = (o: Partial<RemovalFormValues['flags']> = {}): RemovalFormValues['flags'] =>
    ({ mention: 'sold', customMention: '', quantity: 1, placement: '', ...o });

  it('drapeaux : mention facultative, 2 maximum, emplacement facultatif', () => {
    const withoutMention = removalSchema.safeParse(only(['flags']));
    expect(withoutMention.success && withoutMention.data.flags?.mention).toBeNull();
    expect(removalSchema.safeParse(only(['flags'], { flags: flags() })).success).toBe(true);
    expect(issuePaths(removalSchema.safeParse(only(['flags'], { flags: flags({ quantity: 3 }) }))))
      .toContain('flags.quantity');
  });

  it('drapeaux : « Autres » exige le texte de la mention', () => {
    expect(issuePaths(removalSchema.safeParse(only(['flags'], { flags: flags({ mention: 'other' }) }))))
      .toContain('flags.customMention');
    const result = removalSchema.safeParse(only(['flags'], { flags: flags({ mention: 'other', customMention: 'Prix réduit' }) }));
    expect(result.success && result.data.flags).toEqual({ mention: 'other', customMention: 'Prix réduit', quantity: 1, placement: '' });
  });

  it('directionnelles : mention facultative, au moins une, emplacements facultatifs', () => {
    expect(issuePaths(removalSchema.safeParse(only(['directional'])))).toEqual(['directionals.units']);
    expect(removalSchema.safeParse(only(['directional'], {
      directionals: { mention: null, units: [createRemovalDirectional()] },
    })).success).toBe(true);
    expect(removalSchema.safeParse(only(['directional'], {
      directionals: { mention: 'forRent', units: [createRemovalDirectional()] },
    })).success).toBe(true);
  });

  it('autres : détails requis', () => {
    expect(issuePaths(removalSchema.safeParse(only(['other'])))).toContain('otherDetails');
  });

  it('aller-retour complet', () => {
    const first = removalSchema.parse(only(['keybox', 'flags', 'directional', 'other'], {
      keybox: { quantity: 2, code: '123456', placement: 'Rampe avant' },
      flags: flags({ mention: 'other', customMention: 'Prix réduit', quantity: 2, placement: 'Coin de la rue' }),
      directionals: { mention: 'sold', units: [{ ...createRemovalDirectional(), placement: 'Newman et Léger' }] },
      otherDetails: 'Retirer le support mural',
    }));
    expect(removalSchema.parse(toRemovalFormValues(first))).toEqual(first);
  });
});

import { expectReadable } from './expectReadable.testUtils';

describe('removalSchema — relecture depuis la base', () => {
  it.each<[string, RemovalFormValues]>([
    ['pancartes : sol, mur, balcon', form([
      unit({ location: 'ground' }),
      unit({ location: 'wall', access: 'smallLadder', mounting: 'flatDoubleTape' }),
      unit({ location: 'balcony', access: 'keybox', keyboxInfo: 'Code 4821', mounting: 'vShapeDrilled' }),
    ])],
    ['pancartes : fenêtre, autre', form([
      unit({ location: 'window', access: 'phoneAppointment', contact: '514-555-0000', windowSide: 'exterior' }),
      unit({ location: 'other', description: 'Derrière la haie' }),
    ])],
    ['ajouts avec précision', {
      ...createEmptyRemovalForm(),
      materials: ['addons'],
      addons: { units: [unit({ location: 'ramp' })], details: 'Le « Vendu »' },
    }],
    ['boîtes, drapeaux, directionnelles, autres', {
      ...createEmptyRemovalForm(),
      materials: ['keybox', 'flags', 'directional', 'other'],
      keybox: { quantity: 2, code: '123456', placement: 'Rampe avant' },
      flags: { mention: 'forSale', customMention: '', quantity: 2, placement: 'Coin de la rue' },
      directionals: { mention: 'forSale', units: [{ ...createRemovalDirectional(), placement: 'Newman et Léger' }] },
      otherDetails: 'Retirer le support mural',
    }],
  ])('%s', (_, values) => expectReadable('removal', removalSchema, values));
});
import { removalDetailsSchema } from './residentialDomain.schema';

describe('removalDetailsSchema — retraits enregistrés avant la question de la mention', () => {
  it('restent lisibles, sans mention', () => {
    const result = removalDetailsSchema.safeParse({
      frames: null, addons: null, keybox: null, otherDetails: null,
      flags: { quantity: 1, placement: '' },
      directionals: { units: [{ uid: 'd1', placement: '' }] },
    });
    expect(result.success && result.data.flags?.mention).toBeNull();
    expect(result.success && result.data.directionals?.mention).toBeNull();
  });
});

describe('createRemovalSchema — invités : que faire du matériel retiré', () => {
  const guest = createRemovalSchema({ isMember: false });
  const base = (overrides: Partial<RemovalFormValues> = {}): RemovalFormValues => ({
    ...createEmptyRemovalForm(),
    materials: ['other'],
    otherDetails: 'Support mural',
    ...overrides,
  });
  const paths = (r: ReturnType<typeof guest.safeParse>) => (r.success ? [] : r.error.issues.map((i) => i.path.join('.')));

  it('exige un choix', () => {
    expect(paths(guest.safeParse(base()))).toContain('afterRemoval');
  });

  it('livraison : adresse obligatoire, dépôt facultatif', () => {
    expect(paths(guest.safeParse(base({ afterRemoval: 'deliver' })))).toContain('deliveryAddress');
    const r = guest.safeParse(base({ afterRemoval: 'deliver', deliveryAddress: '123 rue Principale', dropOff: '' }));
    expect(r.success && r.data.afterRemoval).toEqual({ choice: 'deliver', address: '123 rue Principale', dropOff: null });
  });

  it('laisser sur place et entreposage', () => {
    const left = guest.safeParse(base({ afterRemoval: 'leaveOnSite', dropOff: 'Dans le garage' }));
    expect(left.success && left.data.afterRemoval).toEqual({ choice: 'leaveOnSite', dropOff: 'Dans le garage' });
    const stored = guest.safeParse(base({ afterRemoval: 'storage' }));
    expect(stored.success && stored.data.afterRemoval).toEqual({ choice: 'storage' });
  });

  it('membre : question ignorée, afterRemoval null', () => {
    const r = removalSchema.safeParse(base());
    expect(r.success && r.data.afterRemoval).toBeNull();
  });
});
