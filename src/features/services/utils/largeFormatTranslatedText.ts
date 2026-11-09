import type { LargeFormatService } from '../types/services';
import type { LargePlacement, StructureChoice } from '../types/largeFormat';

/** Traducteur du namespace "services" (useTranslations côté client, getTranslations côté serveur) */
export type ServicesTranslator = (key: string, values?: Record<string, string | number>) => string;

/*
 * Détails d'un service grand format dans la langue du traducteur.
 * Mêmes lignes que utils/largeFormatText (français, courriel interne) ; partagé par le résumé
 * du formulaire et la confirmation de commande envoyée au client.
 */
export function describeLargeFormatServiceTranslated(service: LargeFormatService, t: ServicesTranslator): string[] {
  const describePlacement = (p: LargePlacement): string =>
    p.location === 'wall'
      ? t('largeFormat.text.wallAccess', {
          location: t('largeFormat.locations.wall'),
          access: t(`access.${p.access}`).toLowerCase(),
        })
      : t('largeFormat.locations.ground');

  const describePaint = (color: string | null): string =>
    color ? t('largeFormat.text.paint', { color }) : t('largeFormat.text.noPaint');

  const describeStructure = (s: StructureChoice): string => {
    const label = t(`largeFormat.structures.${s.structure}`);
    switch (s.structure) {
      case 'aluminumFramd':
      case 'signageFramd':
        // « Oui » seul serait ambigu hors du formulaire : on précise qu'il s'agit de la location
        return `${label} — ${s.acquisition === 'rent' ? t('largeFormat.text.rental') : t(`largeFormat.acquisitions.${s.acquisition}`).toLowerCase()}`;
      case 'woodFramd':
      case 'woodEasel':
        return `${label} — ${t(`largeFormat.styles.${s.style}`).toLowerCase()}, ${describePaint(s.paintColor)}`;
    }
  };

  switch (service.type) {
    case 'largeInstallation': {
      const lines = [
        t('largeFormat.text.dimensions', { value: service.dimensions }),
        t('largeFormat.text.placement', { value: describePlacement(service) }),
      ];
      if (service.location === 'ground') {
        lines.push(...service.structures.map((s) => t('largeFormat.text.structure', { value: describeStructure(s) })));
      }
      return lines;
    }
    case 'largeStoragePickup':
      return [
        t('largeFormat.text.storageMaterials', {
          value: service.materials.map((m) => t(`largeFormat.storageMaterials.${m}`)).join(', '),
        }),
      ];
    case 'largeRetrieval':
      return [t('largeFormat.text.retrievalPlace', { value: describePlacement(service) })];
  }
}
