import { describe, expect, it } from 'vitest';
import { calculateTaxes } from '../pricing/taxes';
import {
  coversExactly,
  getOrderAccess,
  planServicesSettlement,
  quoteOrderServices,
  resolveBilledToId,
  sumAmounts,
  withoutPrices,
  type Amounts,
  type BillingAccount,
  type QuotableOrder,
  type SettlementOrderState,
} from './billing';

const SOLO = 'solo';
const MEMBER = 'member';
const ADMIN = 'admin';
const STRANGER = 'stranger';

const memberAccount = (overrides: Partial<BillingAccount> = {}): BillingAccount => ({
  id: MEMBER,
  groupStatus: 'JOINED',
  group: { billingMode: 'GROUP', adminId: ADMIN },
  ...overrides,
});

const amountsFor = (subtotal: number): Amounts => {
  const { tps, tvq } = calculateTaxes(subtotal);
  return { subtotal, tps, tvq, total: subtotal + tps + tvq };
};

describe('payeur des services (figé au checkout)', () => {
  it('solo : se paie lui-même', () => {
    expect(resolveBilledToId({ id: SOLO, groupStatus: 'SOLO', group: null })).toBe(SOLO);
  });

  it('membre en mode INDIVIDUAL : se paie lui-même', () => {
    const account = memberAccount({ group: { billingMode: 'INDIVIDUAL', adminId: ADMIN } });
    expect(resolveBilledToId(account)).toBe(MEMBER);
  });

  it('membre en mode GROUP : facturé au groupAdmin', () => {
    expect(resolveBilledToId(memberAccount())).toBe(ADMIN);
  });

  it('membre PENDING en mode GROUP : se paie lui-même', () => {
    expect(resolveBilledToId(memberAccount({ groupStatus: 'PENDING' }))).toBe(MEMBER);
  });

  it('groupAdmin en mode GROUP : se paie lui-même', () => {
    expect(resolveBilledToId(memberAccount({ id: ADMIN }))).toBe(ADMIN);
  });

  it('groupe sans admin en mode GROUP : le membre se paie lui-même', () => {
    const account = memberAccount({ group: { billingMode: 'GROUP', adminId: null } });
    expect(resolveBilledToId(account)).toBe(MEMBER);
  });
});

describe("droits d'un utilisateur sur une commande", () => {
  it.each([
    { label: 'solo, sa commande', order: { ownerId: SOLO, billedToId: SOLO }, viewer: SOLO, canSeePrices: true, canPay: true },
    { label: 'membre INDIVIDUAL, sa commande', order: { ownerId: MEMBER, billedToId: MEMBER }, viewer: MEMBER, canSeePrices: true, canPay: true },
    { label: 'admin INDIVIDUAL, commande du membre', order: { ownerId: MEMBER, billedToId: MEMBER }, viewer: ADMIN, canSeePrices: false, canPay: false },
    { label: 'membre GROUP, sa commande', order: { ownerId: MEMBER, billedToId: ADMIN }, viewer: MEMBER, canSeePrices: true, canPay: false },
    { label: 'admin GROUP, commande du membre', order: { ownerId: MEMBER, billedToId: ADMIN }, viewer: ADMIN, canSeePrices: true, canPay: true },
    { label: 'admin, sa propre commande', order: { ownerId: ADMIN, billedToId: ADMIN }, viewer: ADMIN, canSeePrices: true, canPay: true },
    { label: 'autre utilisateur', order: { ownerId: MEMBER, billedToId: ADMIN }, viewer: STRANGER, canSeePrices: false, canPay: false },
    { label: 'commande invité', order: { ownerId: null, billedToId: null }, viewer: ADMIN, canSeePrices: false, canPay: false },
  ])('$label', ({ order, viewer, canSeePrices, canPay }) => {
    expect(getOrderAccess(order, viewer)).toEqual({ canSeePrices, canPay });
  });
});

describe('masquage des prix', () => {
  const requests = [
    {
      id: 'r1',
      requestType: 'residential',
      addresses: [
        {
          id: 'a1',
          city: 'Laval',
          services: [
            { id: 's1', type: 'installation', price: 12_345 },
            { id: 's2', type: 'removal', price: null },
          ],
        },
      ],
    },
  ];

  it('met tous les prix à null et garde le reste', () => {
    expect(withoutPrices(requests)).toEqual([
      {
        id: 'r1',
        requestType: 'residential',
        addresses: [
          {
            id: 'a1',
            city: 'Laval',
            services: [
              { id: 's1', type: 'installation', price: null },
              { id: 's2', type: 'removal', price: null },
            ],
          },
        ],
      },
    ]);
  });

  it("ne laisse aucun montant dans ce qui est envoyé au client", () => {
    expect(JSON.stringify(withoutPrices(requests))).not.toContain('12345');
  });

  it("ne modifie pas l'objet d'origine", () => {
    const snapshot = structuredClone(requests);
    withoutPrices(requests);
    expect(requests).toEqual(snapshot);
  });
});

describe("calcul d'une facture de services", () => {
  const order = (overrides: Partial<QuotableOrder> = {}): QuotableOrder => ({
    status: 'PENDING',
    hasSucceededServicesPayment: false,
    services: [{ price: 10_000, status: 'TO_SCHEDULE' }],
    ...overrides,
  });

  it('calcule les taxes sur les services actifs seulement', () => {
    const result = quoteOrderServices(
      order({
        services: [
          { price: 10_000, status: 'TO_SCHEDULE' },
          { price: 5_000, status: 'COMPLETED' },
          { price: 99_999, status: 'CANCELLED' },
          { price: null, status: 'CANCELLED' }, // annulé : son prix manquant ne bloque pas
        ],
      }),
    );
    expect(result).toEqual({ ok: true, ...amountsFor(15_000) });
  });

  it.each([
    { label: 'commande annulée', input: { status: 'CANCELLED' }, reason: 'cancelled' },
    { label: 'services déjà payés', input: { hasSucceededServicesPayment: true }, reason: 'alreadyPaid' },
    { label: 'aucun service', input: { services: [] }, reason: 'noServices' },
    { label: 'tous les services annulés', input: { services: [{ price: 100, status: 'CANCELLED' }] }, reason: 'noServices' },
    { label: 'un prix manquant', input: { services: [{ price: 100, status: 'TO_SCHEDULE' }, { price: null, status: 'SCHEDULED' }] }, reason: 'priceMissing' },
    { label: 'annulée prime sur prix manquant', input: { status: 'CANCELLED', services: [{ price: null, status: 'TO_SCHEDULE' }] }, reason: 'cancelled' },
  ] satisfies { label: string; input: Partial<QuotableOrder>; reason: string }[])('refuse : $label', ({ input, reason }) => {
    expect(quoteOrderServices(order(input))).toEqual({ ok: false, reason });
  });
});

describe('total de plusieurs factures', () => {
  it('additionne les taxes calculées par commande, sans les recalculer sur le total', () => {
    const lines = [333, 667, 1].map(amountsFor);
    const sum = sumAmounts(lines);

    expect(sum.subtotal).toBe(1_001);
    expect(sum.tps).toBe(lines.reduce((s, l) => s + l.tps, 0));
    expect(sum.tvq).toBe(lines.reduce((s, l) => s + l.tvq, 0));
    expect(sum.total).toBe(sum.subtotal + sum.tps + sum.tvq);
  });

  it('vaut zéro pour une sélection vide', () => {
    expect(sumAmounts([])).toEqual({ subtotal: 0, tps: 0, tvq: 0, total: 0 });
  });
});

describe("réutilisation d'un paiement en attente", () => {
  it.each([
    { label: 'même sélection, ordre différent', payment: ['a', 'b'], selected: ['b', 'a'], expected: true },
    { label: 'sélection plus petite', payment: ['a', 'b'], selected: ['a'], expected: false },
    { label: 'sélection plus grande', payment: ['a'], selected: ['a', 'b'], expected: false },
    { label: 'sélection différente, même taille', payment: ['a', 'b'], selected: ['a', 'c'], expected: false },
    { label: 'doublons dans la sélection', payment: ['a'], selected: ['a', 'a'], expected: true },
  ])('$label', ({ payment, selected, expected }) => {
    expect(coversExactly(payment, selected)).toBe(expected);
  });
});

describe("règlement d'un paiement de services", () => {
  const allocation = (orderId: string, total: number) => ({ id: `alloc-${orderId}`, total, order: { id: orderId } });
  const state = (id: string, overrides: Partial<SettlementOrderState> = {}): SettlementOrderState => ({
    id,
    status: 'PENDING',
    paidByAnotherPayment: false,
    ...overrides,
  });

  const allocations = [allocation('o1', 1_000), allocation('o2', 2_000), allocation('o3', 3_000)];

  it('solde toutes les commandes payables, sans remboursement', () => {
    const plan = planServicesSettlement(allocations, [state('o1'), state('o2'), state('o3')]);
    expect(plan.accepted).toEqual(allocations);
    expect(plan.refused).toEqual([]);
    expect(plan.refundAmount).toBe(0);
  });

  it('rembourse seulement la part des commandes annulées, payées ailleurs ou supprimées', () => {
    const plan = planServicesSettlement(allocations, [
      state('o1', { status: 'CANCELLED' }),
      state('o2', { paidByAnotherPayment: true }),
      // o3 absente : supprimée entre-temps
    ]);
    expect(plan.accepted).toEqual([]);
    expect(plan.refused.map((a) => a.order.id)).toEqual(['o1', 'o2', 'o3']);
    expect(plan.refundAmount).toBe(6_000);
  });

  it('solde les autres commandes du lot quand une seule est refusée', () => {
    const plan = planServicesSettlement(allocations, [state('o1'), state('o2', { status: 'CANCELLED' }), state('o3')]);
    expect(plan.accepted.map((a) => a.order.id)).toEqual(['o1', 'o3']);
    expect(plan.refundAmount).toBe(2_000);
  });

  it('accepte une commande mixte déjà PAID (produits payés au checkout)', () => {
    const plan = planServicesSettlement([allocation('o1', 1_000)], [state('o1', { status: 'PAID' })]);
    expect(plan.accepted).toHaveLength(1);
  });
});