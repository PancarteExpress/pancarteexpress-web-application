import type { InstallationDetails } from '@/features/services/types/installation';
import type { RemovalDetails } from '@/features/services/types/removal';

/* Détails de services valides (domaine), pour les tests des courriels par numéro PE */

export const installationDetails: InstallationDetails = {
  pickupAddress: null,
  frames: {
    units: [
      {
        uid: 'f1',
        model: { type: 'regular' },
        displayName: { type: 'custom', names: 'Ana Roy' },
        placement: { location: 'wall', ladder: 'smallLadder', mounting: 'vShapeDrilled' },
      },
      { uid: 'f2', model: null, displayName: null, placement: { location: 'ground' } },
    ],
  },
  kits: null,
  addons: [
    { addon: 'sold', model: { type: 'regular' }, quantity: 2, frameUids: ['f1'], onSiteCount: 1, placements: null },
  ],
  openHouse: {
    dates: ['2026-11-21'],
    startTime: '13:30',
    endTime: '16:00',
    quantity: 1,
    frameUids: ['f2'],
    onSiteCount: 0,
    placements: null,
    directionals: [{ uid: 'd1', placement: 'Coin Newman et Léger' }, { uid: 'd2', placement: '' }],
    flagCount: 2,
    removeNextMonday: true,
  },
  keybox: { code: '1234', placement: 'Rampe avant' },
  flags: null,
  directionals: null,
  otherNeeds: 'Appeler avant de passer',
};

export const removalDetails: RemovalDetails = {
  afterRemoval: null,
  frames: { units: [{ uid: 'r1', placement: { location: 'ground' } }] },
  addons: null,
  keybox: { quantity: 1, code: '9999', placement: '' },
  flags: null,
  directionals: null,
  otherDetails: null,
};
