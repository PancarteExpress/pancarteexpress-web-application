
import type { AddressKind, ServiceDelay, ServiceType } from '@prisma/client';
import type { IsoDate } from './calendar';
import { computeSchedule, type OptimoPriority } from './scheduling';
import type { OptimoOrderPayload } from './server/client';
import { buildServiceNotes } from './notes';
 
const OPEN_HOUSE_REMOVAL_LABEL = 'RECUP VISITE LIBRE';
 
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
 
type OptimoCustomer = { firstName: string; lastName: string; email: string; phone: string | null };
 
export type OptimoPayloadInput = {
  orderNo: string;
  /** Date de création de la commande : fige la date même lors d'un réessai par le cron. */
  orderCreatedAt: Date;
  delay: ServiceDelay;
  requestedDate: Date | null;
  address: OptimoAddressInput;
  serviceTypes: ServiceType[];
  customer: OptimoCustomer;
};
 
export type OpenHouseRemovalInput = {
  orderNo: string;
  date: IsoDate;
  address: OptimoAddressInput;
  customer: OptimoCustomer;
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
 
/** Champs communs à toutes les tâches d'une adresse. */
function buildTask(
  orderNo: string,
  date: IsoDate,
  priority: OptimoPriority,
  label: string,
  addressInput: OptimoAddressInput,
  customer: OptimoCustomer,
): OptimoOrderPayload {
  const { firstName, lastName, email, phone } = customer;
  const fullName = clean([firstName, lastName], ' ').toLocaleUpperCase('fr-CA');
  const terrain = addressInput.kind === 'terrain' ? addressInput.description : null;
  const address = formatOptimoAddress(addressInput);
 
  return {
    operation: 'SYNC',
    orderNo,
    type: 'T',
    date,
    location: { address, locationName: address, acceptPartialMatch: true },
    notes: clean([label, fullName, terrain ? `Terrain : ${terrain}` : null], ' — '),
    priority,
    email,
    ...(phone ? { phone } : {}),
    customField2: firstName,
    customField3: lastName,
  };
}
 
export function buildOptimoPayload(input: OptimoPayloadInput): OptimoOrderPayload {
  const { date, priority } = computeSchedule(
    input.delay,
    input.requestedDate ? dbDateToIso(input.requestedDate) : null,
    input.orderCreatedAt,
  );
  // Même texte que l'aperçu du formulaire
  const services = buildServiceNotes(input.serviceTypes);
 
  return buildTask(input.orderNo, date, priority, services, input.address, input.customer);
}
 
/** Tâche de retrait de la visite libre, à sa date prévue. */
export function buildOpenHouseRemovalPayload(input: OpenHouseRemovalInput): OptimoOrderPayload {
  return buildTask(input.orderNo, input.date, 'M', OPEN_HOUSE_REMOVAL_LABEL, input.address, input.customer);
}
 