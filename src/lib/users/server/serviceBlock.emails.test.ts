import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({ user: { findMany: vi.fn(), updateMany: vi.fn() } }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail }));

const { notifyEffectiveServiceBlocks, sendServiceBlockWarningEmail } = await import('./serviceBlock.emails');

const user = { id: 'u1', email: 'ana@example.com', firstName: 'Ana', role: 'user', group: null };

describe('courriels de blocage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sendEmail.mockResolvedValue(undefined);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("l'avertissement donne la date limite de paiement", async () => {
    await sendServiceBlockWarningEmail(
      { email: 'ana@example.com', firstName: 'Ana', blocksTeam: false },
      new Date('2026-11-12T13:35:00Z'),
    );

    const { to, text } = sendEmail.mock.calls[0][0] as { to: string; text: string };
    expect(to).toBe('ana@example.com');
    expect(text).toContain('12 novembre 2026');
  });

  it('le cron envoie le courriel de blocage effectif puis le marque comme envoyé', async () => {
    prismaMock.user.findMany.mockResolvedValue([user]);

    await expect(notifyEffectiveServiceBlocks()).resolves.toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { serviceBlockNoticeSentAt: expect.any(Date) } }),
    );
  });

  it("ne marque rien si l'envoi échoue (retenté au prochain cron)", async () => {
    prismaMock.user.findMany.mockResolvedValue([user]);
    sendEmail.mockRejectedValue(new Error('SMTP indisponible'));

    await expect(notifyEffectiveServiceBlocks()).resolves.toBe(0);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("mentionne l'équipe quand l'admin paie pour tout le groupe", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ ...user, role: 'groupAdmin', group: { billingMode: 'GROUP' } }]);

    await notifyEffectiveServiceBlocks();

    const { text } = sendEmail.mock.calls[0][0] as { text: string };
    expect(text).toContain('membres de votre équipe');
  });
});
