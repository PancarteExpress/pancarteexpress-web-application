-- AlterTable
ALTER TABLE "User" ADD COLUMN     "serviceBlockNoticeSentAt" TIMESTAMP(3);

-- Blocages déjà effectifs : pas de courriel rétroactif
UPDATE "User" SET "serviceBlockNoticeSentAt" = NOW()
WHERE "serviceBlockStartsAt" IS NOT NULL AND "serviceBlockStartsAt" <= NOW();
