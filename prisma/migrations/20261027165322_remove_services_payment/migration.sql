/*
  Warnings:

  - You are about to drop the column `draftPrice` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "draftPrice";

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "PaymentKind";

-- DropEnum
DROP TYPE "PaymentStatus";
