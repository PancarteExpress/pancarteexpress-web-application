-- AlterTable
ALTER TABLE "User" ADD COLUMN     "joinedAt" TIMESTAMP(3);

-- Membres existants : date de la migration (l'historique antérieur au rattachement reste caché)
UPDATE "User" SET "joinedAt" = NOW() WHERE "groupId" IS NOT NULL;
