-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoicedAt" TIMESTAMP(3),
ADD COLUMN     "overdueNoticeSentAt" TIMESTAMP(3),
ADD COLUMN     "overdueReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingUnblockedUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_invoicedAt_idx" ON "Order"("invoicedAt");

UPDATE "Order" o SET "invoicedAt" = NOW()
WHERE o."status" <> 'CANCELLED'
  -- Services pas encore payés
  AND NOT EXISTS (
    SELECT 1 FROM "PaymentAllocation" pa JOIN "Payment" p ON p."id" = pa."paymentId"
    WHERE pa."orderId" = o."id" AND p."kind" = 'SERVICES' AND p."status" = 'SUCCEEDED'
  )
  -- Au moins un service actif
  AND EXISTS (
    SELECT 1 FROM "ServiceRequest" sr
    JOIN "ServiceAddress" sa ON sa."serviceRequestId" = sr."id"
    JOIN "Service" s ON s."serviceAddressId" = sa."id"
    WHERE sr."orderId" = o."id" AND s."status" <> 'CANCELLED'
  )
  -- Tous les services actifs ont un prix envoyé
  AND NOT EXISTS (
    SELECT 1 FROM "ServiceRequest" sr
    JOIN "ServiceAddress" sa ON sa."serviceRequestId" = sr."id"
    JOIN "Service" s ON s."serviceAddressId" = sa."id"
    WHERE sr."orderId" = o."id" AND s."status" <> 'CANCELLED' AND s."price" IS NULL
  );