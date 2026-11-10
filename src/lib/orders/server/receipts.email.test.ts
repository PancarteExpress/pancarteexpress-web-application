import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({ order: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() } }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));

const { sendReceipts, retryUnsentReceipts } = await import('./receipts.email');

const order = {
  orderNumber: 1042,
  locale: 'fr' as 'fr' | 'en',
  userId: null as string | null,
  internalReceiptSentAt: null as Date | null,
  clientReceiptSentAt: null as Date | null,
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
  products: [{ productSlug: 'boites-a-cles', productName: 'Boîte à clés', quantity: 1, unitPrice: 2999 }],
  serviceRequests: [],
};

describe('sendReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.order.findUnique.mockResolvedValue(order);
    sendEmail.mockResolvedValue(undefined);
    prismaMock.order.update.mockResolvedValue({});
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

  it('enregistre chaque envoi réussi', async () => {
    await sendReceipts('o1');

    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'o1' }, data: { internalReceiptSentAt: expect.any(Date) } }),
    );
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'o1' }, data: { clientReceiptSentAt: expect.any(Date) } }),
    );
  });

  it("n'enregistre pas un envoi échoué (il sera relancé)", async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP indisponible'));

    await sendReceipts('o1');

    expect(prismaMock.order.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: { clientReceiptSentAt: expect.any(Date) } }));
  });

  it('ne renvoie que les courriels sans date d\'envoi', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...order, internalReceiptSentAt: new Date() });

    await sendReceipts('o1');

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ana@example.com' }));
  });

  it('le cron relance chaque commande en attente', async () => {
    prismaMock.order.findMany.mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]);

    await expect(retryUnsentReceipts()).resolves.toBe(2);
    expect(prismaMock.order.findUnique).toHaveBeenCalledTimes(2);
  });

  it('précise que le montant payé ne couvre que les produits quand il y a des services', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      serviceRequests: [{ requestType: 'residential', delay: 'standard24h', requestedDate: null, addresses: [] }],
    });

    await sendReceipts('o1');

    const [internal, client] = sendEmail.mock.calls.map(([options]) => options as { text: string });
    expect(internal.text).toContain('Total (produits seulement)');
    expect(internal.text).toContain('Les services sont à facturer sur soumission');
    expect(client.text).toContain('Le montant payé couvre uniquement les produits');
  });

  it('envoie la confirmation dans la langue du checkout, le reçu interne restant en français', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      locale: 'en',
      serviceRequests: [
        {
          requestType: 'residential',
          delay: 'urgent12h',
          requestedDate: null,
          addresses: [
            {
              addressNumber: 11111,
              kind: 'civicAddress',
              streetNumber: '200',
              streetName: 'Boulevard Lebeau',
              apartment: null,
              description: null,
              nearbyAddress: null,
              city: 'Montréal',
              services: [{ type: 'removal', details: {} }],
            },
          ],
        },
      ],
    });

    await sendReceipts('o1');

    const [internal, client] = sendEmail.mock.calls.map(([options]) => options as { subject: string; text: string });
    expect(internal.text).toContain('Produits :');
    expect(internal.text).toContain('Retrait');
    expect(internal.text).toContain('- PE-11111 [Résidentielle] 200 Boulevard Lebeau, Montréal : Retrait');
    expect(client.subject).toBe('Your order #1042 confirmation | Pancarte Express');
    expect(client.text).toContain('Key boxes ×1');
    expect(client.text).toContain('GST: ');
    expect(client.text).toContain('Turnaround: Urgent 12 h');
    expect(client.text).toContain('- PE-11111 [Residential request] 200 Boulevard Lebeau, Montréal: Removal');
    expect(client.text).toContain('The amount paid covers the products only');
  });

  it("n'ajoute pas de mention sur les services s'il n'y en a pas", async () => {
    await sendReceipts('o1');

    const { text } = sendEmail.mock.calls[1][0] as { text: string };
    expect(text).not.toContain('soumission');
    expect(text).toContain('Total : ');
  });

  it("n'envoie que le reçu interne pour un client connecté (commande visible au dashboard)", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...order, userId: 'u1' });

    await sendReceipts('o1');

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'equipe@pancarte.test' }));
    // Marquée comme traitée : le cron ne la relance pas
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { clientReceiptSentAt: expect.any(Date) } }),
    );
  });

  it("n'envoie rien si la commande est introuvable", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(sendReceipts('o1')).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
