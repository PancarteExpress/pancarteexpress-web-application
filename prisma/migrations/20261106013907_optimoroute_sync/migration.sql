-- CreateEnum
CREATE TYPE "OptimoSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "ServiceAddress" ADD COLUMN     "optimoRouteId" TEXT,
ADD COLUMN     "optimoSyncError" TEXT,
ADD COLUMN     "optimoSyncStatus" "OptimoSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "optimoSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ServiceAddress_optimoSyncStatus_idx" ON "ServiceAddress"("optimoSyncStatus");
