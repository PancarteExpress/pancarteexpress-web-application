import { describe, expect, it } from 'vitest';
import {
  addDays,
  collectServiceBlocks,
  computeServiceAccess,
  daysUntil,
  isBilledToGroupAdmin,
  resolveBilledToId,
  type AccessViewer,
  type BillingAccount,
  type BlockableUser,
} from './billing';

const SOLO = 'solo';
const MEMBER = 'member';
const ADMIN = 'admin';

const memberAccount = (overrides: Partial<BillingAccount> = {}): BillingAccount => ({
  id: MEMBER,
  groupStatus: 'JOINED',
  group: { billingMode: 'GROUP', adminId: ADMIN },
  ...overrides,
});

describe('payeur des services (figé au checkout)', () => {
  it('solo : se paie lui-même', () => {
    expect(resolveBilledToId({ id: SOLO, groupStatus: 'SOLO', group: null })).toBe(SOLO);
  });

  it('membre en mode INDIVIDUAL : se paie lui-même', () => {
    expect(resolveBilledToId(memberAccount({ group: { billingMode: 'INDIVIDUAL', adminId: ADMIN } }))).toBe(MEMBER);
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
    expect(resolveBilledToId(memberAccount({ group: { billingMode: 'GROUP', adminId: null } }))).toBe(MEMBER);
  });
});

describe('blocage manuel des demandes de service', () => {
  const NOW = new Date('2026-10-28T12:00:00Z');
  const SOON = addDays(NOW, 2);
  const PAST = addDays(NOW, -1);

  const person = (id: string, role: 'user' | 'groupAdmin', serviceBlockStartsAt: Date | null = null): BlockableUser => ({
    id,
    role,
    groupStatus: 'JOINED',
    serviceBlockStartsAt,
  });

  const inGroup = (viewer: BlockableUser, billingMode: 'GROUP' | 'INDIVIDUAL', users: BlockableUser[]): AccessViewer => ({
    ...viewer,
    group: { billingMode, users },
  });

  it('arrondit les jours restants vers le haut', () => {
    expect(daysUntil(addDays(NOW, 2.1), NOW)).toBe(3);
  });

  it('aucun blocage : accès normal', () => {
    expect(computeServiceAccess([], NOW)).toEqual({ status: 'ok' });
  });

  it('blocage programmé : avertissement', () => {
    expect(computeServiceAccess([{ startsAt: SOON, source: 'self' }], NOW)).toEqual({
      status: 'warning',
      startsAt: SOON,
      source: 'self',
    });
  });

  it('date atteinte : bloqué', () => {
    expect(computeServiceAccess([{ startsAt: PAST, source: 'self' }], NOW)).toEqual({ status: 'blocked', source: 'self' });
  });

  it('bloqué prime sur avertissement, et son propre blocage prime', () => {
    const result = computeServiceAccess(
      [
        { startsAt: PAST, source: 'member' },
        { startsAt: PAST, source: 'self' },
        { startsAt: SOON, source: 'groupAdmin' },
      ],
      NOW,
    );
    expect(result).toEqual({ status: 'blocked', source: 'self' });
  });

  it('solo bloqué : seulement lui', () => {
    const solo: AccessViewer = { ...person('solo', 'user', PAST), groupStatus: 'SOLO', group: null };
    expect(collectServiceBlocks(solo)).toEqual([{ startsAt: PAST, source: 'self' }]);
  });

  it('l’admin paie tout, admin bloqué : le membre est bloqué aussi', () => {
    const admin = person('admin', 'groupAdmin', PAST);
    const member = person('member', 'user');
    expect(collectServiceBlocks(inGroup(member, 'GROUP', [admin, member]))).toEqual([
      { startsAt: PAST, source: 'groupAdmin' },
    ]);
  });

  it('chacun paie, admin bloqué : les membres ne le sont pas', () => {
    const admin = person('admin', 'groupAdmin', PAST);
    const member = person('member', 'user');
    expect(collectServiceBlocks(inGroup(member, 'INDIVIDUAL', [admin, member]))).toEqual([]);
  });

  it('chacun paie, membre bloqué : l’admin est bloqué aussi', () => {
    const admin = person('admin', 'groupAdmin');
    const member = person('member', 'user', PAST);
    expect(collectServiceBlocks(inGroup(admin, 'INDIVIDUAL', [admin, member]))).toEqual([
      { startsAt: PAST, source: 'member' },
    ]);
  });

  it('chacun paie, membre bloqué : les autres membres ne le sont pas', () => {
    const admin = person('admin', 'groupAdmin');
    const blocked = person('m1', 'user', PAST);
    const other = person('m2', 'user');
    expect(collectServiceBlocks(inGroup(other, 'INDIVIDUAL', [admin, blocked, other]))).toEqual([]);
  });

  it('membre PENDING : non concerné par le blocage de l’admin', () => {
    const admin = person('admin', 'groupAdmin', PAST);
    const pending: BlockableUser = { ...person('member', 'user'), groupStatus: 'PENDING' };
    expect(collectServiceBlocks(inGroup(pending, 'GROUP', [admin, pending]))).toEqual([]);
  });

  it.each([
    { label: 'membre, l’admin paie tout', role: 'user', groupStatus: 'JOINED', mode: 'GROUP', expected: true },
    { label: 'membre, chacun paie', role: 'user', groupStatus: 'JOINED', mode: 'INDIVIDUAL', expected: false },
    { label: 'admin, l’admin paie tout', role: 'groupAdmin', groupStatus: 'JOINED', mode: 'GROUP', expected: false },
    { label: 'membre PENDING, l’admin paie tout', role: 'user', groupStatus: 'PENDING', mode: 'GROUP', expected: false },
  ] as const)('blocage direct impossible si facturé à l’admin : $label', ({ role, groupStatus, mode, expected }) => {
    expect(isBilledToGroupAdmin({ role, groupStatus, group: { billingMode: mode } })).toBe(expected);
  });
});