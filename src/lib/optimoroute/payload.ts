import type { AddressKind, ServiceDelay, ServiceType } from '@prisma/client';
import type { IsoDate } from './calendar';
import { computeSchedule } from './scheduling';
import type { OptimoOrderPayload } from './server/client';

/** Libellés internes pour les chauffeurs (OptimoRoute), toujours en français. */
const SERVICE_NOTE_LABELS: Record<ServiceType, string> = {
  installation: 'INSTALLATION',
  removal: 'RECUP',
  correction: 'CORRECTION',
  pickup: 'RAMASSAGE',
  delivery: 'LIVRAISON',

  // Jamais envoyés à OptimoRoute (grand format exclu de la synchronisation) ; requis par le type
  largeInstallation: 'INSTALLATION GRAND FORMAT',
  largeStoragePickup: 'RAMASSAGE ENTREPOSAGE',
  largeRetrieval: 'RECUP GRAND FORMAT',
};

export type OptimoAddressInput = {
  kind: AddressKind;
  streetNumber: string | null;
  streetName: string | null;
  apartment: string | null;
  postalCode: string | null;
  description: string | null;
  nearbyAddress: string | null;
  city: string;
};

export type OptimoPayloadInput = {
  orderNo: string;
  /** Date de création de la commande : fige la date même lors d'un réessai par le cron. */
  orderCreatedAt: Date;
  delay: ServiceDelay;
  requestedDate: Date | null;
  address: OptimoAddressInput;
  serviceTypes: ServiceType[];
  customer: { firstName: string; lastName: string; email: string; phone: string | null };
};

const clean = (parts: Array<string | null | undefined>, sep: string) =>
  parts.map((p) => p?.trim()).filter(Boolean).join(sep);

/** Adresse envoyée au géocodage d'OptimoRoute. */
export function formatOptimoAddress(a: OptimoAddressInput): string {
  if (a.kind === 'terrain') return clean([a.nearbyAddress, a.city], ', ');
  const street = clean([a.streetNumber, a.streetName], ' ');
  const withApt = a.apartment ? `${street} app. ${a.apartment.trim()}` : street;
  return clean([withApt, a.city, a.postalCode], ', ');
}

/** Colonne @db.Date → "YYYY-MM-DD" (Prisma la renvoie à minuit UTC). */
const dbDateToIso = (d: Date): IsoDate => d.toISOString().slice(0, 10);

export function buildOptimoPayload(input: OptimoPayloadInput): OptimoOrderPayload {
  const { date, priority } = computeSchedule(
    input.delay,
    input.requestedDate ? dbDateToIso(input.requestedDate) : null,
    input.orderCreatedAt,
  );

  const { firstName, lastName, email, phone } = input.customer;
  const fullName = clean([firstName, lastName], ' ').toLocaleUpperCase('fr-CA');
  const services = [...new Set(input.serviceTypes)].map((t) => SERVICE_NOTE_LABELS[t]).join(' + ');
  const terrain = input.address.kind === 'terrain' ? input.address.description : null;

  const address = formatOptimoAddress(input.address);

  return {
    operation: 'SYNC',
    orderNo: input.orderNo,
    type: 'T',
    date,
    location: { address, locationName: address, acceptPartialMatch: true },
    notes: clean([services, fullName, terrain ? `Terrain : ${terrain}` : null], ' — '),
    priority,
    email,
    ...(phone ? { phone } : {}),
    customField2: firstName,
    customField3: lastName,
  };
}
