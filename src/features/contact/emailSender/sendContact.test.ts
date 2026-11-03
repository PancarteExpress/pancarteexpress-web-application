import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactFormData } from '../schemas/contact.schema';

const sendMail = vi.hoisted(() => vi.fn());

vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: sendMail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));

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

  it("n'envoie qu'à l'équipe, le visiteur en replyTo", async () => {
    await expect(sendContact(valide)).resolves.toEqual({ success: true });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'equipe@pancarte.test', replyTo: 'ana@example.com' }),
    );
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
  });
});
