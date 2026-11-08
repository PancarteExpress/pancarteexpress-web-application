import { describe, expect, it } from 'vitest';
import { describeLargeFormatService } from '../utils/largeFormatText';
import { parseLargeFormatService } from './largeFormatDomain.schema';

describe('services grand format : relecture et texte', () => {
  it('relit et décrit une installation au sol', () => {
    const service = parseLargeFormatService('largeInstallation', {
      id: 'ignoré',
      dimensions: '8 x 4 pi',
      location: 'ground',
      structures: [
        { structure: 'aluminumFramd', acquisition: 'rent' },
        { structure: 'woodEasel', style: 'recto', paintColor: 'Noir mat' },
      ],
    });
    expect(service).not.toBeNull();
    expect(service && describeLargeFormatService(service)).toEqual([
      'Dimensions : 8 x 4 pi',
      'Emplacement : Au sol',
      'Structure : Structure en aluminium FRAMD — location',
      'Structure : Structure en bois « Chevalet » — recto, peinture : Noir mat',
    ]);
  });

  it('décrit une récupération au mur avec son accès', () => {
    const service = parseLargeFormatService('largeRetrieval', { location: 'wall', access: 'boomLift' });
    expect(service && describeLargeFormatService(service)).toEqual([
      "Endroit de la pancarte : Au mur — accès : nacelle jusqu'à 35 pieds",
    ]);
  });

  it('renvoie null pour des détails illisibles', () => {
    expect(parseLargeFormatService('largeInstallation', { location: 'roof' })).toBeNull();
    expect(parseLargeFormatService('largeRetrieval', null)).toBeNull();
  });
});
