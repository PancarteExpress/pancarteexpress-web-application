import { describe, expect, it } from 'vitest';
import {
  createDeliveryAddon, createDeliveryDirectional, createDeliveryFrame, createDeliveryOther, createEmptyDeliveryForm,
  deliverySchema, toDeliveryFormValues, type DeliveryFormValues,
} from './delivery.schema';

const paths = (r: ReturnType<typeof deliverySchema.safeParse>): string[] =>
  r.success ? [] : r.error.issues.map((i) => i.path.map(String).join('.'));

const form = (o: Partial<DeliveryFormValues>): DeliveryFormValues => ({ ...createEmptyDeliveryForm(), ...o });

describe('deliverySchema', () => {
  it('exige au moins un matériel, et au moins un modèle par matériel coché', () => {
    expect(paths(deliverySchema.safeParse(createEmptyDeliveryForm()))).toEqual(['materials']);
    expect(paths(deliverySchema.safeParse(form({ materials: ['frames'] })))).toEqual(['frames']);
  });

  it('pancartes : Régulier et Non par défaut', () => {
    const r = deliverySchema.safeParse(form({ materials: ['frames'], frames: [createDeliveryFrame()] }));
    expect(r.success && r.data.frames).toEqual([{ model: 'regular', quantity: 1, withAnchorsAndPoles: false }]);
  });

  it('refuse un modèle en double, sauf les modèles particuliers', () => {
    expect(paths(deliverySchema.safeParse(form({
      materials: ['frames'],
      frames: [createDeliveryFrame(), createDeliveryFrame()],
    })))).toEqual(['frames.1.model']);

    const custom = { ...createDeliveryFrame(), model: 'custom' as const, description: 'Rouge' };
    expect(deliverySchema.safeParse(form({
      materials: ['frames'],
      frames: [custom, { ...custom, uid: 'autre', description: 'Bleu' }],
    })).success).toBe(true);
  });

  it('ajouts : mention obligatoire pour « Autres », modèle facultatif pour l\'ajout personnalisé', () => {
    expect(paths(deliverySchema.safeParse(form({
      materials: ['addons'],
      addons: [{ ...createDeliveryAddon(), addon: 'other' }],
    })))).toEqual(['addons.0.mention']);

    const r = deliverySchema.safeParse(form({
      materials: ['addons'],
      addons: [{ ...createDeliveryAddon(), addon: 'customNoMention' }, { ...createDeliveryAddon(), addon: 'customNoMention' }],
    }));
    expect(r.success && r.data.addons).toEqual([
      { addon: 'customNoMention', model: null, quantity: 1 },
      { addon: 'customNoMention', model: null, quantity: 1 },
    ]);
  });

  it('respecte les quantités maximales', () => {
    expect(paths(deliverySchema.safeParse(form({
      materials: ['other'],
      others: [{ ...createDeliveryOther(), description: 'Support', quantity: 11 }],
    })))).toEqual(['others.0.quantity']);
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = deliverySchema.parse(form({
      materials: ['frames', 'addons', 'keybox', 'directional', 'other'],
      frames: [{ ...createDeliveryFrame(), model: 'custom', description: 'Rouge', quantity: 4, withAnchorsAndPoles: true }],
      addons: [{ ...createDeliveryAddon(), addon: 'other', mention: 'Prix réduit', quantity: 2 }],
      keybox: { quantity: 2, code: '4821' },
      directionals: [{ ...createDeliveryDirectional(), model: 'openHouse', quantity: 3, withPoles: true }],
      others: [{ ...createDeliveryOther(), description: 'Support mural', quantity: 1 }],
    }));
    expect(deliverySchema.parse(toDeliveryFormValues(first))).toEqual(first);
  });
});