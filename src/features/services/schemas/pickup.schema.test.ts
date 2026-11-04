import { describe, expect, it } from 'vitest';
import { createEmptyPickupForm, pickupSchema, toPickupFormValues } from './pickup.schema';

const issuePaths = (result: ReturnType<typeof pickupSchema.safeParse>): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.map(String).join('.'));

describe('pickupSchema', () => {
  it('exige au moins un élément', () => {
    expect(issuePaths(pickupSchema.safeParse(createEmptyPickupForm()))).toEqual(['materials']);
  });

  it('détails facultatifs par défaut, matériels remis dans l\'ordre de la liste', () => {
    const result = pickupSchema.safeParse({ ...createEmptyPickupForm(), materials: ['poles', 'frames'] });
    expect(result.success && result.data).toEqual({ materials: ['frames', 'poles'], newModels: false, details: null });
  });

  it('détails obligatoires avec « Autres » ou de nouveaux modèles', () => {
    expect(issuePaths(pickupSchema.safeParse({ ...createEmptyPickupForm(), materials: ['other'] }))).toEqual(['details']);
    expect(issuePaths(pickupSchema.safeParse({ ...createEmptyPickupForm(), materials: ['frames'], newModels: true })))
      .toEqual(['details']);
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = pickupSchema.parse({ materials: ['frames', 'other'], newModels: true, details: 'Nouvelle agence' });
    expect(pickupSchema.parse(toPickupFormValues(first))).toEqual(first);
  });
});