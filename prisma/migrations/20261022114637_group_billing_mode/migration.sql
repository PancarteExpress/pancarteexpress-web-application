-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('INDIVIDUAL', 'GROUP');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "billingMode" "BillingMode" NOT NULL DEFAULT 'INDIVIDUAL';
