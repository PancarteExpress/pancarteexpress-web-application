-- AlterTable
ALTER TABLE "ServiceAddress" ADD COLUMN     "internalEmailSentAt" TIMESTAMP(3);

-- Adresses existantes : considérées comme déjà envoyées, pour que le cron ne renvoie pas d'anciens courriels
UPDATE "ServiceAddress" SET "internalEmailSentAt" = NOW();
