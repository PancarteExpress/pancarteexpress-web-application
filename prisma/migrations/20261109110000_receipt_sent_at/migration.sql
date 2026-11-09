-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientReceiptSentAt" TIMESTAMP(3),
ADD COLUMN     "internalReceiptSentAt" TIMESTAMP(3);

-- Commandes existantes : considérées comme déjà envoyées, pour que le cron ne renvoie pas d'anciens courriels
UPDATE "Order"
SET "internalReceiptSentAt" = "createdAt", "clientReceiptSentAt" = "createdAt"
WHERE "status" <> 'AWAITING_PAYMENT';
