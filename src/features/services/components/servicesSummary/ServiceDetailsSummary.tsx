import { useTranslations } from 'next-intl';
import type { ServiceType } from '@prisma/client';
import { parseServiceDetails } from '../../schemas/serviceDetails.schema';
import { describeLargeFormatService } from '../../utils/largeFormatText';
import { InstallationSummary } from './installation/InstallationSummary';
import { RemovalSummary } from './removal/RemovalSummary';
import { CorrectionSummary } from './correction/CorrectionSummary';
import { PickupSummary } from './pickup/PickupSummary';
import { DeliverySummary } from './delivery/DeliverySummary';
import styles from './servicesSummary.module.css';

/** Détails d'un service enregistré (Service.details), relus et validés selon son type */
export function ServiceDetailsSummary({ type, details }: { type: ServiceType; details: unknown }) {
  const t = useTranslations('services');
  const parsed = parseServiceDetails(type, details);

  if (!parsed) return <p className={styles.muted}>{t('summary.detailsUnavailable')}</p>;

  switch (parsed.kind) {
    case 'installation':
      return <InstallationSummary details={parsed.details} />;
    case 'removal':
      return <RemovalSummary details={parsed.details} />;
    case 'correction':
      return <CorrectionSummary details={parsed.details} />;
    case 'pickup':
      return <PickupSummary details={parsed.details} />;
    case 'delivery':
      return <DeliverySummary details={parsed.details} />;
    case 'largeFormat':
      return (
        <div className={styles.installation}>
          <ul className={styles.lines}>
            {describeLargeFormatService(parsed.details).map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      );
  }
}