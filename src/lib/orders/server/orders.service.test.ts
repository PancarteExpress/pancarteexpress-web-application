import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIRMED_ORDER_STATUSES } from '@/lib/orders/constants';

const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn() },
  order: { findMany: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { getTeamOrders, getUserOrders, teamOrdersWhere } = await import('./orders.service');

const confirmedOnly = { status: { in: [...CONFIRMED_ORDER_STATUSES] } };

describe('teamOrdersWhere', () => {
  it('limite chaque membre à ses commandes confirmées depuis joinedAt et ignore les membres sans date', () => {
    const joinedAt = new Date('2026-11-01T00:00:00Z');

    expect(teamOrdersWhere([
      { id: 'm1', joinedAt },
      { id: 'm2', joinedAt: null },
    ])).toEqual({ ...confirmedOnly, OR: [{ userId: 'm1', createdAt: { gte: joinedAt } }] });
  });
});

describe('getUserOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("n'affiche que les commandes confirmées (exclut AWAITING_PAYMENT)", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await getUserOrders('u1');

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', ...confirmedOnly } }),
    );
    expect(CONFIRMED_ORDER_STATUSES).not.toContain('AWAITING_PAYMENT');
  });
});

describe('getTeamOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exclut l'admin, filtre par date d'entrée et par statut confirmé", async () => {
    const joinedAt = new Date('2026-11-01T00:00:00Z');
    prismaMock.user.findMany.mockResolvedValue([{ id: 'm1', joinedAt }]);
    prismaMock.order.findMany.mockResolvedValue([]);

    await getTeamOrders('g1', 'admin');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { groupId: 'g1', id: { not: 'admin' } } }),
    );
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...confirmedOnly, OR: [{ userId: 'm1', createdAt: { gte: joinedAt } }] },
      }),
    );
  });

  it("ne lit aucune commande si aucun membre n'a de date d'entrée", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'm1', joinedAt: null }]);

    await expect(getTeamOrders('g1', 'admin')).resolves.toEqual([]);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});