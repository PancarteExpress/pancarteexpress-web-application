import { describe, expect, it } from 'vitest';
import { installationDetailsSchema } from '../schemas/residentialDomain.schema';
import { upgradeInstallationDetails } from './legacyInstallation';

/** Installation au format d'avant novembre 2026 : un seul emplacement pour tout */
const legacy = (overrides: Record<string, unknown> = {}) => ({
  placement: { location: 'ramp' },
  frames: { pickupAddress: null, units: [{ uid: 'f1', model: null, displayName: null }] },
  kits: null,
  addons: [{ addon: 'forSale', quantity: 1, frameUids: ['f1'], onSiteCount: 0 }],
  openHouse: null,
  keybox: null,
  flags: { mention: 'sold', quantity: 1 },
  directionals: null,
  otherNeeds: null,
  ...overrides,
});

describe('upgradeInstallationDetails', () => {
  it('reporte l\'ancien emplacement sur chaque pancarte ; les ajouts vont sur elles', () => {
    expect(upgradeInstallationDetails(legacy())).toMatchObject({
      frames: { units: [{ uid: 'f1', placement: { location: 'ramp' } }] },
      addons: [{ addon: 'forSale', placements: null }],
      flags: { placement: '' },
    });
  });

  it('sans pancarte : les ajouts reçoivent l\'ancien emplacement', () => {
    const upgraded = upgradeInstallationDetails(legacy({
      frames: null,
      addons: [{ addon: 'forSale', quantity: 2, frameUids: [], onSiteCount: 2 }],
    }));
    expect(upgraded).toMatchObject({ addons: [{ placements: [{ location: 'ramp' }] }] });
  });

  it('une ancienne commande reste lisible en base', () => {
    expect(installationDetailsSchema.safeParse(legacy()).success).toBe(true);
  });

  it('laisse intactes les données au nouveau format', () => {
    const current = { frames: null, addons: null };
    expect(upgradeInstallationDetails(current)).toBe(current);
  });
});
