
import { describe, expect, it } from 'vitest';
import { openHouseRemovalDate } from './openHouse';
import { buildOpenHouseRemovalPayload } from './payload';
 
const details = (dates: string[], removeNextMonday: boolean) => ({ frames: null, openHouse: { dates, removeNextMonday, flagCount: 0 } });
 
describe('openHouseRemovalDate', () => {
  it('vendredi → lundi suivant', () => {
    expect(openHouseRemovalDate(details(['2026-11-20'], true))).toBe('2026-11-23');
  });
  it('deux dates → lundi après la dernière', () => {
    expect(openHouseRemovalDate(details(['2026-11-22', '2026-11-21'], true))).toBe('2026-11-23');
  });
  it('visite un lundi → lundi de la semaine suivante', () => {
    expect(openHouseRemovalDate(details(['2026-11-23'], true))).toBe('2026-11-30');
  });
  it('lundi férié (Patriotes) → mardi', () => {
    expect(openHouseRemovalDate(details(['2026-05-16', '2026-05-17'], true))).toBe('2026-05-19');
  });
  it('retrait refusé → null', () => {
    expect(openHouseRemovalDate(details(['2026-11-20'], false))).toBeNull();
  });
  it('sans visite libre ou détails invalides → null', () => {
    expect(openHouseRemovalDate({ openHouse: null })).toBeNull();
    expect(openHouseRemovalDate({})).toBeNull();
    expect(openHouseRemovalDate('n/a')).toBeNull();
  });
});
 
describe('buildOpenHouseRemovalPayload', () => {
  it('tâche de retrait avec sa date et ses notes', () => {
    const p = buildOpenHouseRemovalPayload({
      orderNo: 'PE-11111-R',
      date: '2026-11-23',
      address: {
        kind: 'civicAddress',
        streetNumber: '1001',
        streetName: 'Boulevard Décarie',
        apartment: null,
        postalCode: 'H4A 3J1',
        description: null,
        nearbyAddress: null,
        city: 'Montréal',
      },
      notes: '2x RECUP AJOUT VISITE LIBRE ÉLISE TREMBLAY',
      customer: { firstName: 'Élise', lastName: 'Tremblay', email: 'e@x.ca', phone: null },
    });
    expect(p).toMatchObject({ orderNo: 'PE-11111-R', date: '2026-11-23', priority: 'M', type: 'T' });
    // Note reçue telle quelle (2e aperçu du formulaire)
    expect(p.notes).toBe('2x RECUP AJOUT VISITE LIBRE ÉLISE TREMBLAY');
  });
});
 