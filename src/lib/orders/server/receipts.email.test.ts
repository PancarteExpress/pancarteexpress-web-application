import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({ order: { findUnique: vi.fn() } }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));

const { sendReceipts } = await import('./receipts.email');

const order = {
  orderNumber: 1042,
  firstName: 'Ana',
  lastName: 'Roy',
  email: 'ana@example.com',
  phone: null,
  paidAt: new Date(),
  deliveryMode: 'PICKUP',
  deliveryStreet: null,
  deliveryCity: null,
  deliveryPostalCode: null,
  subtotal: 2999,
  tps: 150,
  tvq: 299,
  total: 3448,
  products: [{ productName: 'Boîte à clés', quantity: 1, unitPrice: 2999 }],
  serviceRequests: [],
};

describe('sendReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.order.findUnique.mockResolvedValue(order);
    sendEmail.mockResolvedValue(undefined);
  });

  it("envoie le reçu interne puis la confirmation au client, via sendEmail", async () => {
    await sendReceipts('o1');

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: 'equipe@pancarte.test', replyTo: 'ana@example.com' }));
    expect(sendEmail).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: 'ana@example.com', replyTo: 'equipe@pancarte.test' }));
  });

  it("ne choisit jamais l'expéditeur (imposé par sendEmail)", async () => {
    await sendReceipts('o1');

    for (const [options] of sendEmail.mock.calls) expect(options).not.toHaveProperty('from');
  });

  it('envoie la confirmation client même si le courriel interne échoue', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP indisponible'));

    await expect(sendReceipts('o1')).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenLastCalledWith(expect.objectContaining({ to: 'ana@example.com' }));
  });

  it("n'envoie rien si la commande est introuvable", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(sendReceipts('o1')).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
