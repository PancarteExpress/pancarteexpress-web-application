import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactFormData } from '../schemas/contact.schema';

const sendMail = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => ({ isRateLimited: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: sendMail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'fr',
  getTranslations: async () => (key: string) => key,
}));
// La limite elle-même est testée dans rateLimit.test.ts : ici, on vérifie seulement son usage
vi.mock('@/lib/rateLimit/server/rateLimit', () => ({
  isRateLimited: rateLimitMock.isRateLimited,
  ipKey: async () => 'ip:test',
  LIMITS: { contactIp: { max: 3, windowMs: 600_000 } },
}));

const { sendContact } = await import('./sendContact');

const valide: ContactFormData = {
  firstName: 'Ana',
  lastName: 'Roy',
  phoneNumber: '(514) 555-0000',
  email: 'ana@example.com',
  reason: 'Besoin de pancartes',
  elapsedMs: 10_000, // rempli en 10 s : un humain
};

describe('sendContact', () => {
  beforeEach(() => {
    vi.restoreAllMocks(); // retire les espions console d'un test à l'autre
    sendMail.mockReset();
    sendMail.mockResolvedValue(undefined);
    rateLimitMock.isRateLimited.mockReset().mockResolvedValue(false);
  });

  /* ── Envoi ──────────────────────────────────────────────────── */

  it("envoie à l'équipe (visiteur en replyTo), puis la confirmation au visiteur", async () => {
    await expect(sendContact(valide)).resolves.toEqual({ success: true });

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: 'equipe@pancarte.test', replyTo: 'ana@example.com' }),
    );
    expect(sendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ to: 'ana@example.com', replyTo: 'equipe@pancarte.test' }),
    );
  });

  it('ne reprend pas le message du visiteur dans la confirmation', async () => {
    await sendContact(valide);

    const { text, html } = sendMail.mock.calls[1][0] as { text: string; html: string };
    expect(text).not.toContain(valide.reason);
    expect(html).not.toContain(valide.reason);
  });

  it("réussit même si la confirmation échoue (l'équipe a reçu la demande)", async () => {
    sendMail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('SMTP indisponible'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendContact(valide)).resolves.toEqual({ success: true });
  });

  it("renvoie une erreur si l'envoi échoue", async () => {
    sendMail.mockRejectedValue(new Error('SMTP indisponible'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendContact(valide)).resolves.toEqual({ success: false, error: 'sendFailed' });
    // Pas de fausse confirmation si l'équipe n'a rien reçu
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  /* ── Validation ─────────────────────────────────────────────── */

  it('refuse une liste de destinataires', async () => {
    const result = await sendContact({ ...valide, email: 'a@x.com, b@y.com' });

    expect(result).toEqual({ success: false, error: 'invalid' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuse un champ trop long', async () => {
    const result = await sendContact({ ...valide, firstName: 'a'.repeat(101) });

    expect(result).toEqual({ success: false, error: 'invalid' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuse un téléphone hors du format (514) 555-0000', async () => {
    const result = await sendContact({ ...valide, phoneNumber: '514-555-0000' });

    expect(result).toEqual({ success: false, error: 'invalid' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('retire les retours à la ligne du sujet', async () => {
    await sendContact({ ...valide, firstName: 'Ana\r\nBcc: x@y.com' });

    const { subject } = sendMail.mock.calls[0][0] as { subject: string };
    expect(subject).not.toMatch(/[\r\n]/);
  });

  /* ── Anti-spam ──────────────────────────────────────────────── */

  it('ignore en silence un envoi dont le champ piège est rempli', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(sendContact({ ...valide, website: 'http://spam.test' })).resolves.toEqual({ success: true });
    expect(sendMail).not.toHaveBeenCalled();
    expect(rateLimitMock.isRateLimited).not.toHaveBeenCalled();
  });

  it('ignore en silence un formulaire rempli trop vite', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(sendContact({ ...valide, elapsedMs: 800 })).resolves.toEqual({ success: true });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("vérifie la limite par IP avec l'action contact", async () => {
    await sendContact(valide);

    expect(rateLimitMock.isRateLimited).toHaveBeenCalledWith('contact', [
      { key: 'ip:test', limit: { max: 3, windowMs: 600_000 } },
    ]);
  });

  it('bloque quand la limite par IP est atteinte, sans courriel', async () => {
    rateLimitMock.isRateLimited.mockResolvedValue(true);

    await expect(sendContact(valide)).resolves.toEqual({ success: false, error: 'rateLimited' });
    expect(sendMail).not.toHaveBeenCalled();
  });
});