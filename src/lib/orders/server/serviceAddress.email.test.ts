import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { installationDetails, removalDetails } from './serviceAddress.email.fixtures';

const prismaMock = vi.hoisted(() => ({ serviceAddress: { findMany: vi.fn(), update: vi.fn() } }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail, INTERNAL_EMAIL: 'equipe@pancarte.test' }));

const { buildServiceAddressEmail, sendServiceAddressEmails } = await import('./serviceAddress.email');
const { describeServiceDetailsText } = await import('@/features/services/utils/serviceDetailsText');
const { servicesTranslator } = await import('@/lib/i18n/looseTranslator');

/** Comme en base : détails stockés en JSON */
const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;

const address = (addressNumber: number) => ({
  id: `a${addressNumber}`,
  addressNumber,
  kind: 'civicAddress' as const,
  streetNumber: '200',
  streetName: 'Boulevard Lebeau',
  apartment: null,
  postalCode: 'H4N 1R4',
  description: null,
  nearbyAddress: null,
  city: 'Montréal',
  delay: 'urgent12h' as const,
  requestedDate: null,
  attachments: [] as { id: string; fileName: string }[],
  services: [
    { type: 'installation' as const, details: asJson(installationDetails) },
    { type: 'removal' as const, details: asJson(removalDetails) },
  ],
  serviceRequest: {
    requestType: 'residential' as const,
    order: { orderNumber: 1042, firstName: 'Ana', lastName: 'Roy', email: 'ana@example.com', phone: null },
  },
});

describe('courriel par numéro PE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sendEmail.mockResolvedValue(undefined);
    prismaMock.serviceAddress.update.mockResolvedValue({});
  });

  it('détaille chaque service de l’adresse', () => {
    const { subject, sections } = buildServiceAddressEmail(address(11111));
    const text = sections.map((lines) => lines.join('\n')).join('\n\n');

    expect(subject).toBe('[PE-11111] Installation, Retrait — 200 Boulevard Lebeau, Montréal');
    expect(text).toContain('Adresse : 200 Boulevard Lebeau, Montréal H4N 1R4');
    expect(text).toContain('Délai : Urgence 12 h');
    expect(text).toContain('INSTALLATION');
    expect(text).toContain('    Nom affiché : Ana Roy');
    expect(text).toContain('  Code : 1234');
    expect(text).toContain('RETRAIT');
    expect(text).toContain('  Pancarte 1 : Au sol');
  });

  it('signale des détails illisibles au lieu de les masquer', () => {
    const a = { ...address(11111), services: [{ type: 'correction' as const, details: asJson({ kind: 'inconnu' }) }] };
    const text = buildServiceAddressEmail(a).sections.flat().join('\n');

    expect(text).toContain('Détails illisibles');
  });

  it('envoie un courriel par numéro, puis le marque comme envoyé', async () => {
    prismaMock.serviceAddress.findMany.mockResolvedValue([address(11111), address(11112)]);

    await sendServiceAddressEmails('o1');

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: 'equipe@pancarte.test', replyTo: 'ana@example.com', subject: expect.stringContaining('[PE-11111]') }),
    );
    expect(prismaMock.serviceAddress.update).toHaveBeenCalledWith({
      where: { id: 'a11112' },
      data: { internalEmailSentAt: expect.any(Date) },
    });
  });

  it("ne marque pas un numéro dont l'envoi a échoué (relancé par le cron)", async () => {
    prismaMock.serviceAddress.findMany.mockResolvedValue([address(11111), address(11112)]);
    sendEmail.mockRejectedValueOnce(new Error('SMTP indisponible'));

    await sendServiceAddressEmails('o1');

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(prismaMock.serviceAddress.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.serviceAddress.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'a11112' } }));
  });
});

describe('texte détaillé des services', () => {
  it('installation : ajouts sous leur pancarte, ceux sur place à part', () => {
    const lines = describeServiceDetailsText('installation', installationDetails, servicesTranslator('fr'), 'fr') ?? [];

    // Pancarte 1 : ajout « Vendu » ; pancarte 2 : visite libre du samedi
    expect(lines).toContain('    Ajouts : Vendu — Régulier');
    expect(lines).toContain('    Ajouts : Visite libre samedi 13 h 30 à 16 h 00');
    // L'unité restante de « Vendu » va sur une pancarte déjà sur place
    const onSite = lines.indexOf('Ajouts — pancartes sur place');
    expect(lines.slice(onSite, onSite + 3)).toEqual(['Ajouts — pancartes sur place', '  Vendu — Régulier', '    Sur place']);
    expect(lines).toContain('Détails de la visite libre');
    expect(lines.some((l) => l.includes('Affichettes'))).toBe(false);
  });

  it('existe aussi en anglais', () => {
    const lines = describeServiceDetailsText('installation', installationDetails, servicesTranslator('en'), 'en');

    expect(lines).toContain('    Displayed name: Ana Roy');
    expect(lines).toContain('  Removal the following Monday: Yes (Monday, November 23, 2026)');
  });
});
