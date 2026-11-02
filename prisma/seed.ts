// Crée le compte superAdmin unique (idempotent).
// Usage : SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD dans l'environnement, puis `npx prisma db seed`
// Exécuté par Node directement (types retirés nativement, Node >= 23.6), d'où l'import en .ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/bcrypt.ts";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

async function main(prisma: PrismaClient) {
  const email = requireEnv("SUPERADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SUPERADMIN_PASSWORD");

  const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  if (existing) {
    console.log(`Compte ${email} déjà présent (rôle ${existing.role}) : rien à faire.`);
    return;
  }

  const superAdmin = await prisma.user.findFirst({ where: { role: "superAdmin" }, select: { email: true } });
  if (superAdmin) {
    throw new Error(`Un superAdmin existe déjà (${superAdmin.email}) : compte unique, création annulée.`);
  }

  await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      emailVerified: new Date(),
      role: "superAdmin",
      groupStatus: "SOLO",
    },
  });
  console.log(`superAdmin ${email} créé.`);
}

const prisma = new PrismaClient();
try {
  await main(prisma);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
