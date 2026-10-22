-- Nouvelle table
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tps" INTEGER NOT NULL,
    "tvq" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PaymentAllocation_orderId_idx" ON "PaymentAllocation"("orderId");
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_orderId_key" ON "PaymentAllocation"("paymentId", "orderId");
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payeur
ALTER TABLE "Payment" ADD COLUMN "payerId" TEXT;
CREATE INDEX "Payment_payerId_kind_status_idx" ON "Payment"("payerId", "kind", "status");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerId_fkey"
  FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Données existantes : 1 paiement = 1 allocation, payeur = auteur de la commande
INSERT INTO "PaymentAllocation" ("id", "paymentId", "orderId", "subtotal", "tps", "tvq", "total")
SELECT gen_random_uuid()::text, "id", "orderId", "subtotal", "tps", "tvq", "total" FROM "Payment";

UPDATE "Payment" p SET "payerId" = o."userId" FROM "Order" o WHERE o."id" = p."orderId";

-- Ancienne colonne (Postgres supprime aussi son index et sa clé étrangère)
ALTER TABLE "Payment" DROP COLUMN "orderId";