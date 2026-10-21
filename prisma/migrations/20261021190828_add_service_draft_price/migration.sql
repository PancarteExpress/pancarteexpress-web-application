-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "draftPrice" INTEGER;
-- Les prix déjà envoyés servent de brouillon de départ
UPDATE "Service" SET "draftPrice" = "price" WHERE "price" IS NOT NULL;