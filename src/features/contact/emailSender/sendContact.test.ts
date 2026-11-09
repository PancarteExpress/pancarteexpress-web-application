import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactFormData } from '../schemas/contact.schema';

const sendMail = vi.hoisted(() => vi.fn());

vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: sendMail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'fr',
  getTranslations: async () => (key: string) => key,
}));

const { sendContact } = await import('./sendContact');

const valide: ContactFormData = {
  firstName: 'Ana',
  lastName: 'Roy',
  phoneNumber: '514-555-0000',
  email: 'ana@example.com',
  reason: 'Besoin de pancartes',
};

describe('sendContact', () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue(undefined);
  });

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

  it('refuse une liste de destinataires', async () => {
    const result = await sendContact({ ...valide, email: 'a@x.com, b@y.com' });

    expect(result.success).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuse un champ trop long', async () => {
    const result = await sendContact({ ...valide, firstName: 'a'.repeat(101) });

    expect(result.success).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('retire les retours à la ligne du sujet', async () => {
    await sendContact({ ...valide, firstName: 'Ana\r\nBcc: x@y.com' });

    const { subject } = sendMail.mock.calls[0][0] as { subject: string };
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("renvoie une erreur si l'envoi échoue", async () => {
    sendMail.mockRejectedValue(new Error('SMTP indisponible'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendContact(valide)).resolves.toEqual({ success: false, error: "L'envoi a échoué, réessayez plus tard" });
    // Pas de fausse confirmation si l'équipe n'a rien reçu
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
