-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceType" ADD VALUE 'largeInstallation';
ALTER TYPE "ServiceType" ADD VALUE 'largeStoragePickup';
ALTER TYPE "ServiceType" ADD VALUE 'largeRetrieval';

-- AlterTable
ALTER TABLE "ServiceRequest" ALTER COLUMN "delay" DROP NOT NULL,
ALTER COLUMN "delay" DROP DEFAULT;
