import { describe, expect, it } from 'vitest';
import { createEmptyPlacement, type PlacementFormValues } from './placement.schema';
import {
  createEmptyRemovalForm, createRemovalFrameUnit, removalSchema, toRemovalFormValues,
  type RemovalFormValues, type RemovalFrameUnitFormValues,
} from './removal.schema';

const issuePaths = (result: ReturnType<typeof removalSchema.safeParse>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

const unit = (placement: Partial<PlacementFormValues> = { location: 'ground' }): RemovalFrameUnitFormValues => ({
  ...createRemovalFrameUnit(),
  placement: { ...createEmptyPlacement(), ...placement },
});

const form = (units: RemovalFrameUnitFormValues[]): RemovalFormValues => ({
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