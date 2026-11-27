import { describe, expect, it } from 'vitest';
import { buildOptimoPayload, formatOptimoAddress, type OptimoAddressInput } from './payload';

const civic: OptimoAddressInput = {
  kind: 'civicAddress',
  streetNumber: '1234',
  streetName: 'rue Saint-Denis',
  apartment: '3',
  postalCode: 'H2X 3K2',
  description: null,
  nearbyAddress: null,
  city: 'Montréal',
};

const terrain: OptimoAddressInput = {
  kind: 'terrain',
  streetNumber: null,
  streetName: null,
  apartment: null,
  postalCode: null,
  description: 'Coin nord-est, près du lampadaire',
  nearbyAddress: '50 chemin du Lac',
  city: 'Saint-Sauveur',
};

describe('formatOptimoAddress', () => {
  it('adresse civique avec appartement', () => {
    expect(formatOptimoAddress(civic)).toBe('1234 rue Saint-Denis app. 3, Montréal, H2X 3K2');
  });
  it('terrain → adresse à proximité', () => {
    expect(formatOptimoAddress(terrain)).toBe('50 chemin du Lac, Saint-Sauveur');
  });
});

describe('buildOptimoPayload', () => {
  const base = {
    orderNo: '42-1',
    orderCreatedAt: new Date('2026-11-06T12:00:00-05:00'), // vendredi
    delay: 'standard24h' as const,
    requestedDate: null,
    customer: { firstName: 'Élise', lastName: 'Tremblay', email: 'e@x.ca', phone: null },
    accountName: null,
    hasAttachments: false,
  };

  it('date figée sur la création de la commande, notes regroupées', () => {
    const p = buildOptimoPayload({ ...base, address: civic, services: [{ type: 'removal' }, { type: 'installation' }, { type: 'removal' }] });
    expect(p).toMatchObject({ orderNo: '42-1', type: 'T', operation: 'SYNC', date: '2026-11-09', priority: 'M' });
    // Ordre des notes : l'installation avant la récupération
    // Texte de l'aperçu, tel quel : pas de nom du client ajouté
    expect(p.notes).toBe('INSTALLATION + RECUP');
    expect(p).not.toHaveProperty('phone');
  });

  it('terrain : **TERRAIN** [description] à la fin des notes', () => {
    const p = buildOptimoPayload({ ...base, address: terrain, services: [{ type: 'installation' }] });
    expect(p.notes).toBe('INSTALLATION **TERRAIN** [Coin nord-est, près du lampadaire]');
  });

  it('fichiers joints : **VOIR PHOTO** à la toute fin', () => {
    const p = buildOptimoPayload({ ...base, address: terrain, services: [{ type: 'installation' }], hasAttachments: true });
    expect(p.notes).toBe('INSTALLATION **TERRAIN** [Coin nord-est, près du lampadaire] **VOIR PHOTO**');
  });

  it('notes détaillées avec le nom du compte, comme l\'aperçu', () => {
    const p = buildOptimoPayload({
      ...base,
      address: civic,
      accountName: 'Natasha Fournier',
      services: [{ type: 'pickup', materials: ['frames', 'anchors'], newModels: false, details: null }],
    });
    expect(p.notes).toBe('PICK UP NATASHA FOURNIER [Pancartes, Ancrages]');
  });

  it('date précise depuis une colonne @db.Date', () => {
    const p = buildOptimoPayload({
      ...base,
      delay: 'specificDate',
      requestedDate: new Date('2026-12-25T00:00:00Z'),
      address: civic,
      services: [{ type: 'installation' }],
    });
    expect(p.date).toBe('2026-12-28');
  });
});
