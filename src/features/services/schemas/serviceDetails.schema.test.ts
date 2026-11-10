import { describe, it } from 'vitest';
import { expectReadable } from './expectReadable.testUtils';
import { correctionSchema, type CorrectionFormValues } from './correction.schema';
import { pickupSchema, type PickupFormValues } from './pickup.schema';
import {
  createEmptyLargeInstallationForm, largeInstallationSchema, largeRetrievalSchema, largeStoragePickupSchema,
  type LargeInstallationFormValues, type LargeRetrievalFormValues, type LargeStoragePickupFormValues,
} from './largeFormat.schema';
import { PICKUP_MATERIALS } from '../constants/pickup';
import {
  ACQUISITIONS, EASEL_STYLES, LARGE_ACCESS, STORAGE_PICKUP_MATERIALS, WOOD_FRAMD_STYLES,
} from '../constants/largeFormat';

describe('parseServiceDetails relit ce que les formulaires produisent', () => {
  it.each<[string, CorrectionFormValues]>([
    ['redresser', { kind: 'straighten', explanation: '' }],
    ['explication', { kind: 'explain', explanation: 'Pancarte tombée' }],
  ])('correction : %s', (_, values) => expectReadable('correction', correctionSchema, values));

  it.each<[string, PickupFormValues]>([
    ['minimal', { materials: [PICKUP_MATERIALS.find((m) => m !== 'other') ?? PICKUP_MATERIALS[0]], newModels: false, details: '' }],
    ['complet', { materials: [...PICKUP_MATERIALS], newModels: true, details: 'Nouvelle agence' }],
  ])('ramassage : %s', (_, values) => expectReadable('pickup', pickupSchema, values));

  it.each<[string, LargeInstallationFormValues]>([
    ['au mur', { ...createEmptyLargeInstallationForm(), dimensions: '4 x 8', location: 'wall', access: LARGE_ACCESS[0] }],
    ['au sol, toutes structures', {
      ...createEmptyLargeInstallationForm(),
      dimensions: '4 x 8',
      location: 'ground',
      structures: ['aluminumFramd', 'signageFramd', 'woodFramd', 'woodEasel'],
      aluminumAcquisition: ACQUISITIONS[0],
      signageAcquisition: ACQUISITIONS[0],
      woodFramdStyle: WOOD_FRAMD_STYLES[0],
      woodFramdPaint: true,
      woodFramdColor: 'Blanc',
      easelStyle: EASEL_STYLES[0],
      easelPaint: false,
      easelColor: '',
    }],
  ])('installation grand format : %s', (_, values) => expectReadable('largeInstallation', largeInstallationSchema, values));

  it('ramassage pour entreposage', () => {
    const values: LargeStoragePickupFormValues = { materials: [...STORAGE_PICKUP_MATERIALS] };
    expectReadable('largeStoragePickup', largeStoragePickupSchema, values);
  });

  it.each<[string, LargeRetrievalFormValues]>([
    ['au sol', { location: 'ground', access: null }],
    ['au mur', { location: 'wall', access: LARGE_ACCESS[0] }],
  ])('récupération grand format : %s', (_, values) => expectReadable('largeRetrieval', largeRetrievalSchema, values));
});