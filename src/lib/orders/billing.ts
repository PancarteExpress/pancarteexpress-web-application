import type { BillingMode, GroupStatus, OrderStatus, ServiceStatus } from '@prisma/client';
import { calculateTaxes } from '../pricing/taxes';

/* ── Payeur des services (figé au checkout) ───────────────────── */

export interface BillingAccount {
  id: string;
  groupStatus: GroupStatus;
  group: { billingMode: BillingMode; adminId: string | null } | null;
}

export function resolveBilledToId(account: BillingAccount): string {
  const { group } = account;
  // PENDING : pas encore membre. Groupe sans admin : personne d'autre ne peut payer.
  if (account.groupStatus === 'JOINED' && group?.billingMode === 'GROUP' && group.adminId) {
    return group.adminId;
  }
  return account.id;
}

/* ── Droits d'un utilisateur sur une commande ─────────────────── */

export interface OrderAccess {
  canSeePrices: boolean;
  canPay: boolean;
}

export function getOrderAccess(
  order: { ownerId: string | null; billedToId: string | null },
  viewerId: string,
): OrderAccess {
  const canPay = order.billedToId === viewerId;
  // L'auteur voit toujours ses prix (même en mode centralisé) ; le payeur aussi
  return { canPay, canSeePrices: canPay || order.ownerId === viewerId };
}

type PricedRequest = { addresses: { services: { price: number | null }[] }[] };

/** Retire les prix avant l'envoi au client : les masquer dans l'UI ne suffit pas (payload RSC) */
export function withoutPrices<R extends PricedRequest>(requests: readonly R[]): R[] {
  return requests.map((request) => ({
    ...request,
    addresses: request.addresses.map((address) => ({
      ...address,
      services: address.services.map((service) => ({ ...service, price: null })),
    })),
  }));
}

/* ── Calcul d'une facture de services ─────────────────────────── */

export interface Amounts {
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
}

export interface QuotableOrder {
  status: OrderStatus;
  hasSucceededServicesPayment: boolean;
  services: { price: number | null; status: ServiceStatus }[];
}

export type QuoteRefusal = 'cancelled' | 'alreadyPaid' | 'noServices' | 'priceMissing';
export type QuoteResult = ({ ok: true } & Amounts) | { ok: false; reason: QuoteRefusal };

export function quoteOrderServices(order: QuotableOrder): QuoteResult {
  if (order.status === 'CANCELLED') return { ok: false, reason: 'cancelled' };
  if (order.hasSucceededServicesPayment) return { ok: false, reason: 'alreadyPaid' };

  const services = order.services.filter((s) => s.status !== 'CANCELLED');
  if (services.length === 0) return { ok: false, reason: 'noServices' };

  let subtotal = 0;
  for (const service of services) {
    if (service.price === null) return { ok: false, reason: 'priceMissing' };
    subtotal += service.price;
  }

  const { tps, tvq } = calculateTaxes(subtotal);
  return { ok: true, subtotal, tps, tvq, total: subtotal + tps + tvq };
}

const ZERO: Amounts = { subtotal: 0, tps: 0, tvq: 0, total: 0 };

/** Taxes additionnées par commande, jamais recalculées sur le total : aucun écart d'arrondi */
export const sumAmounts = (lines: readonly Amounts[]): Amounts =>
  lines.reduce<Amounts>(
    (sum, l) => ({
      subtotal: sum.subtotal + l.subtotal,
      tps: sum.tps + l.tps,
      tvq: sum.tvq + l.tvq,
      total: sum.total + l.total,
    }),
    ZERO,
  );

/** Un paiement en attente n'est réutilisable que s'il couvre exactement la même sélection */
export function coversExactly(paymentOrderIds: readonly string[], selectedIds: readonly string[]): boolean {
  const selected = new Set(selectedIds);
  return paymentOrderIds.length === selected.size && paymentOrderIds.every((id) => selected.has(id));
}

/* ── Règlement d'un paiement de services (webhook) ────────────── */

export interface SettlementAllocation {
  id: string;
  total: number;
  order: { id: string };
}

export interface SettlementOrderState {
  id: string;
  status: OrderStatus;
  paidByAnotherPayment: boolean;
}

export interface SettlementPlan<A extends SettlementAllocation> {
  accepted: A[];
  refused: A[];
  refundAmount: number;
}

export function planServicesSettlement<A extends SettlementAllocation>(
  allocations: readonly A[],
  orders: readonly SettlementOrderState[],
): SettlementPlan<A> {
  const byId = new Map(orders.map((o) => [o.id, o]));
  const accepted: A[] = [];
  const refused: A[] = [];

  for (const allocation of allocations) {
    const order = byId.get(allocation.order.id);
    // Supprimée, annulée, ou déjà payée par un autre paiement : cette part est remboursée
    const isPayable = order !== undefined && order.status !== 'CANCELLED' && !order.paidByAnotherPayment;
    (isPayable ? accepted : refused).push(allocation);
  }

  return { accepted, refused, refundAmount: refused.reduce((sum, a) => sum + a.total, 0) };
}