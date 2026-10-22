-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billedToId" TEXT;

-- CreateIndex
CREATE INDEX "Order_billedToId_createdAt_idx" ON "Order"("billedToId", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_billedToId_fkey" FOREIGN KEY ("billedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "Order" SET "billedToId" = "userId" WHERE "userId" IS NOT NULL;