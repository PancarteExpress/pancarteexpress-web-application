import { describe, expect, it } from 'vitest';
import {
  createEmptyLargeInstallationForm, createEmptyLargeRetrievalForm, createEmptyLargeStoragePickupForm,
  largeInstallationSchema, largeRetrievalSchema, largeStoragePickupSchema, toLargeInstallationFormValues,
  type LargeInstallationFormValues,
} from './largeFormat.schema';

const paths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.success ? [] : (r.error?.issues ?? []).map((i) => i.path.map(String).join('.'));

const install = (o: Partial<LargeInstallationFormValues>): LargeInstallationFormValues =>
  ({ ...createEmptyLargeInstallationForm(), dimensions: '8 x 4 pi', ...o });

describe('largeInstallationSchema', () => {
  it('exige les dimensions et au moins une structure au sol', () => {
    expect(paths(largeInstallationSchema.safeParse(createEmptyLargeInstallationForm())))
      .toEqual(['dimensions', 'structures']);
  });

  it('au mur : exige l\'accès, sans structure', () => {
    expect(paths(largeInstallationSchema.safeParse(install({ location: 'wall' })))).toEqual(['access']);
    const r = largeInstallationSchema.safeParse(install({ location: 'wall', access: 'boomLift' }));
    expect(r.success && r.data).toEqual({ dimensions: '8 x 4 pi', location: 'wall', access: 'boomLift' });
  });

  it('chaque structure exige ses propres réponses', () => {
    const r = largeInstallationSchema.safeParse(install({ structures: ['aluminumFramd', 'woodEasel'], easelPaint: true }));
    expect(paths(r)).toEqual(['aluminumAcquisition', 'easelStyle', 'easelColor']);
  });

  it('peinture : null si Non, couleur si Oui', () => {
    const r = largeInstallationSchema.safeParse(install({
      structures: ['woodEasel', 'woodFramd'],
      woodFramdStyle: 'vShape', woodFramdPaint: false,
      easelStyle: 'recto', easelPaint: true, easelColor: 'Noir mat',
    }));
    expect(r.success && r.data).toMatchObject({
      structures: [
        { structure: 'woodFramd', style: 'vShape', paintColor: null },
        { structure: 'woodEasel', style: 'recto', paintColor: 'Noir mat' },
      ],
    });
  });

  it('aller-retour domaine ⇄ formulaire', () => {
    const first = largeInstallationSchema.parse(install({
      structures: ['signageFramd', 'woodFramd'],
      signageAcquisition: 'buy',
      woodFramdStyle: 'rectoVerso', woodFramdPaint: true, woodFramdColor: 'Blanc',
    }));
    expect(largeInstallationSchema.parse(toLargeInstallationFormValues(first))).toEqual(first);
  });
});

describe('largeStoragePickupSchema et largeRetrievalSchema', () => {
  it('ramassage : au moins un matériel, dans l\'ordre de la liste', () => {
    expect(paths(largeStoragePickupSchema.safeParse(createEmptyLargeStoragePickupForm()))).toEqual(['materials']);
    const r = largeStoragePickupSchema.safeParse({ materials: ['commercialAddons', 'largeSigns'] });
    expect(r.success && r.data).toEqual({ materials: ['largeSigns', 'commercialAddons'] });
  });

  it('récupération : au sol par défaut, accès exigé au mur', () => {
    expect(largeRetrievalSchema.parse(createEmptyLargeRetrievalForm())).toEqual({ location: 'ground' });
    expect(paths(largeRetrievalSchema.safeParse({ location: 'wall', access: null }))).toEqual(['access']);
  });
});