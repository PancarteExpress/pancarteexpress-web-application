import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  rateLimitAttempt: { count: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }),
}));

const { isRateLimited, ipKey, emailKey, cleanupRateLimitAttempts } = await import('./rateLimit');

const limit = { max: 3, windowMs: 600_000 };

beforeEach(() => {
  vi.restoreAllMocks();
  prismaMock.rateLimitAttempt.count.mockReset().mockResolvedValue(0);
  prismaMock.rateLimitAttempt.createMany.mockReset().mockResolvedValue({ count: 1 });
  prismaMock.rateLimitAttempt.deleteMany.mockReset().mockResolvedValue({ count: 0 });
});

describe('isRateLimited', () => {
  it('laisse passer sous la limite et enregistre une tentative par clé', async () => {
    prismaMock.rateLimitAttempt.count.mockResolvedValue(2);

    await expect(isRateLimited('register', [{ key: 'a', limit }, { key: 'b', limit }])).resolves.toBe(false);
    expect(prismaMock.rateLimitAttempt.createMany).toHaveBeenCalledWith({
      data: [{ action: 'register', key: 'a' }, { action: 'register', key: 'b' }],
    });
  });

  it('bloque à la limite, sans enregistrer de tentative', async () => {
    prismaMock.rateLimitAttempt.count.mockResolvedValue(3);

    await expect(isRateLimited('contact', [{ key: 'a', limit }])).resolves.toBe(true);
    expect(prismaMock.rateLimitAttempt.createMany).not.toHaveBeenCalled();
  });

  it('bloque si une seule des clés a atteint sa limite (ex. courriel visé par plusieurs IP)', async () => {
    prismaMock.rateLimitAttempt.count.mockResolvedValueOnce(0).mockResolvedValueOnce(3);

    await expect(isRateLimited('forgotPassword', [{ key: 'ip', limit }, { key: 'email', limit }])).resolves.toBe(true);
  });

  it('ne compte que les tentatives de la même action et de la fenêtre', async () => {
    const before = Date.now();
    await isRateLimited('register', [{ key: 'a', limit }]);

    const { where } = prismaMock.rateLimitAttempt.count.mock.calls[0][0];
    expect(where).toMatchObject({ action: 'register', key: 'a' });
    expect(where.createdAt.gte.getTime()).toBeGreaterThanOrEqual(before - limit.windowMs);
  });

  it('laisse passer si la base est indisponible (fail-open)', async () => {
    prismaMock.rateLimitAttempt.count.mockRejectedValue(new Error('BD indisponible'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(isRateLimited('contact', [{ key: 'a', limit }])).resolves.toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('clés hachées', () => {
  it("ipKey : première IP de x-forwarded-for, jamais en clair", async () => {
    const key = await ipKey();

    expect(key).toMatch(/^ip:[a-f0-9]{64}$/);
    expect(key).not.toContain('203.0.113.1');
  });

  it('emailKey : insensible à la casse et aux espaces, jamais en clair', () => {
    const key = emailKey('Ana@Example.com ');

    expect(key).toBe(emailKey('ana@example.com'));
    expect(key).toMatch(/^email:[a-f0-9]{64}$/);
    expect(key).not.toContain('ana');
  });
});

describe('cleanupRateLimitAttempts', () => {
  it('supprime les tentatives de plus de 24 h et renvoie le nombre supprimé', async () => {
    prismaMock.rateLimitAttempt.deleteMany.mockResolvedValue({ count: 7 });

    await expect(cleanupRateLimitAttempts()).resolves.toBe(7);
    const { where } = prismaMock.rateLimitAttempt.deleteMany.mock.calls[0][0];
    expect(Date.now() - where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
  });
});