-- This is an empty migration.-- Reprise : un Payment PRODUCTS pour chaque commande qui a déjà un PaymentIntent
INSERT INTO "Payment" (
  "id", "orderId", "kind", "status",
  "subtotal", "tps", "tvq", "total",
  "paymentIntentId", "paidAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  o."id",
  'PRODUCTS'::"PaymentKind",
  CASE WHEN o."paidAt" IS NOT NULL
       THEN 'SUCCEEDED'::"PaymentStatus"
       ELSE 'PENDING'::"PaymentStatus" END,
  o."subtotal", o."tps", o."tvq", o."total",
  o."paymentIntentId",
  o."paidAt",
  o."createdAt",
  NOW()
FROM "Order" o
WHERE o."paymentIntentId" IS NOT NULL;