import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { addDays, resolveBilledToId } from '../src/lib/orders/billing';

const prisma = new PrismaClient();

// Toutes les commandes de test ont cette clé : on peut les supprimer sans toucher aux vraies
const SEED_PREFIX = 'seed-';

const USAGE = [
  'Usage :',
  '  npx tsx --env-file=.env.local scripts/seed-invoice.ts <courriel> <jours depuis l’envoi> [prix en $]',
  '  npx tsx --env-file=.env.local scripts/seed-invoice.ts --reset',
].join('\n');

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Script interdit en production.');

  const [emailArg, daysAgoArg, priceArg = '50'] = process.argv.slice(2);

  if (emailArg === '--reset') {
    const { count } = await prisma.order.deleteMany({ where: { idempotencyKey: { startsWith: SEED_PREFIX } } });
    console.log(`${count} commande(s) de test supprimée(s).`);
    return;
  }

  const daysAgo = Number(daysAgoArg);
  const priceCents = Math.round(Number(priceArg) * 100);
  if (!emailArg || !Number.isFinite(daysAgo) || !Number.isInteger(priceCents) || priceCents <= 0) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: emailArg.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      groupStatus: true,
      group: {
        select: {
          billingMode: true,
          users: { where: { role: 'groupAdmin' }, select: { id: true, email: true }, take: 1 },
        },
      },
    },
  });
  if (!user) throw new Error(`Aucun compte pour ${emailArg}`);

  const admin = user.group?.users[0] ?? null;
  // Même règle que le checkout : le payeur dépend du mode du groupe au moment de la commande
  const billedToId = resolveBilledToId({
    id: user.id,
    groupStatus: user.groupStatus,
    group: user.group && { billingMode: user.group.billingMode, adminId: admin?.id ?? null },
  });
  const invoicedAt = addDays(new Date(), -daysAgo);

  const order = await prisma.order.create({
    data: {
      idempotencyKey: `${SEED_PREFIX}${randomUUID()}`,
      status: 'PENDING',
      userId: user.id,
      billedToId,
      firstName: user.firstName ?? 'Test',
      lastName: user.lastName ?? 'Facture',
      email: user.email,
      phone: user.phoneNumber,
      // Services seulement : aucun montant au checkout
      subtotal: 0,
      tps: 0,
      tvq: 0,
      total: 0,
      createdAt: addDays(invoicedAt, -2), // commande passée deux jours avant l'envoi de la facture
      invoicedAt,
      serviceRequests: {
        create: {
          requestType: 'residential',
          addresses: {
            create: {
              kind: 'civicAddress',
              streetNumber: '123',
              streetName: 'rue du Test',
              postalCode: 'H1H 1H1',
              city: 'Montréal',
              services: {
                create: { type: 'installation', draftPrice: priceCents, price: priceCents, details: {} },
              },
            },
          },
        },
      },
    },
    select: { orderNumber: true },
  });

  const payer = billedToId === user.id ? user.email : admin?.email ?? billedToId;
  console.log(
    `Commande n° ${order.orderNumber} créée pour ${user.email} · payeur : ${payer} · ` +
      `facture envoyée il y a ${daysAgo} jour(s) · ${priceArg} $`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());