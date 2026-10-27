import { describe, expect, it } from 'vitest';
import { createEmptyPlacement, type PlacementFormValues } from './placement.schema';
import {
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

  it('applique les règles de l\'emplacement partagé (fenêtre)', () => {
    const paths = issuePaths(removalSchema.safeParse(form([unit({ location: 'window', access: 'noLadder' })])));
    expect(paths).toContain('frames.units.0.placement.windowSide');
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = removalSchema.parse(form([
      unit({ location: 'balcony', access: 'keybox', keyboxInfo: 'Code 4821' }),
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

  it('drapeaux : 2 maximum, emplacement facultatif', () => {
    expect(removalSchema.safeParse(only(['flags'])).success).toBe(true);
    expect(issuePaths(removalSchema.safeParse(only(['flags'], { flags: { quantity: 3, placement: '' } }))))
      .toContain('flags.quantity');
  });

  it('directionnelles : au moins une, emplacements facultatifs', () => {
    expect(issuePaths(removalSchema.safeParse(only(['directional'])))).toContain('directionals.units');
    expect(removalSchema.safeParse(only(['directional'], {
      directionals: { units: [createRemovalDirectional()] },
    })).success).toBe(true);
  });

  it('autres : détails requis', () => {
    expect(issuePaths(removalSchema.safeParse(only(['other'])))).toContain('otherDetails');
  });

  it('aller-retour complet', () => {
    const first = removalSchema.parse(only(['keybox', 'flags', 'directional', 'other'], {
      keybox: { quantity: 2, code: '123456', placement: 'Rampe avant' },
      flags: { quantity: 2, placement: 'Coin de la rue' },
      directionals: { units: [{ ...createRemovalDirectional(), placement: 'Newman et Léger' }] },
      otherDetails: 'Retirer le support mural',
    }));
    expect(removalSchema.parse(toRemovalFormValues(first))).toEqual(first);
  });
});