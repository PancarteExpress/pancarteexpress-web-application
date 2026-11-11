import type { ServiceType } from '@prisma/client';
import type { InstallationDetails } from '../types/installation';
import type { RemovalDetails } from '../types/removal';
import type { PickupDetails } from '../types/pickup';
import type { DeliveryDetails } from '../types/delivery';
import type { CorrectionDetails } from '../types/correction';
import type { LargeFormatService } from '../types/services';
import {
  correctionDetailsSchema, deliveryDetailsSchema, installationDetailsSchema, pickupDetailsSchema,
  removalDetailsSchema,
} from './residentialDomain.schema';
import { parseLargeFormatService } from './largeFormatDomain.schema';

export type ParsedServiceDetails =
  | { kind: 'installation'; details: InstallationDetails }
  | { kind: 'removal'; details: RemovalDetails }
  | { kind: 'correction'; details: CorrectionDetails }
  | { kind: 'pickup'; details: PickupDetails }
  | { kind: 'delivery'; details: DeliveryDetails }
  | { kind: 'largeFormat'; details: LargeFormatService };

/** Relit Service.details selon son type ; null si illisible */
export function parseServiceDetails(type: ServiceType, details: unknown): ParsedServiceDetails | null {
  switch (type) {
    case 'installation': {
      const r = installationDetailsSchema.safeParse(details);
      return r.success ? { kind: 'installation', details: r.data } : null;
    }
    case 'removal': {
      const r = removalDetailsSchema.safeParse(details);
      return r.success ? { kind: 'removal', details: r.data } : null;
    }
    case 'correction': {
      const r = correctionDetailsSchema.safeParse(details);
      return r.success ? { kind: 'correction', details: r.data } : null;
    }
    case 'pickup': {
      const r = pickupDetailsSchema.safeParse(details);
      return r.success ? { kind: 'pickup', details: r.data } : null;
    }
    case 'delivery': {
      const r = deliveryDetailsSchema.safeParse(details);
      return r.success ? { kind: 'delivery', details: r.data } : null;
    }
    case 'largeInstallation':
    case 'largeStoragePickup':
    case 'largeRetrieval': {
      const parsed = parseLargeFormatService(type, details);
      return parsed ? { kind: 'largeFormat', details: parsed } : null;
    }
  }
}