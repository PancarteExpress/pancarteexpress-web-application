import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn() },
  order: { findMany: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { getTeamOrders, teamOrdersWhere } = await import('./orders.service');

describe('teamOrdersWhere', () => {
  it('limite chaque membre à ses commandes depuis joinedAt et ignore les membres sans date', () => {
    const joinedAt = new Date('2026-11-01T00:00:00Z');

    expect(teamOrdersWhere([
      { id: 'm1', joinedAt },
      { id: 'm2', joinedAt: null },
    ])).toEqual({ OR: [{ userId: 'm1', createdAt: { gte: joinedAt } }] });
  });
});

describe('getTeamOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exclut l'admin et filtre par date d'entrée", async () => {
    const joinedAt = new Date('2026-11-01T00:00:00Z');
    prismaMock.user.findMany.mockResolvedValue([{ id: 'm1', joinedAt }]);
    prismaMock.order.findMany.mockResolvedValue([]);

    await getTeamOrders('g1', 'admin');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { groupId: 'g1', id: { not: 'admin' } } }),
    );
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ userId: 'm1', createdAt: { gte: joinedAt } }] } }),
    );
  });

  it("ne lit aucune commande si aucun membre n'a de date d'entrée", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'm1', joinedAt: null }]);

    await expect(getTeamOrders('g1', 'admin')).resolves.toEqual([]);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});
