/*
  Warnings:

  - The values [address] on the enum `AddressKind` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_PROGRESS] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `fulfillmentMethod` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `productsSubtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `servicesSubtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingPostalCode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingProvince` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingStreet` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductsStatus" AS ENUM ('PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('TO_SCHEDULE', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "AddressKind_new" AS ENUM ('civicAddress', 'terrain');
ALTER TABLE "ServiceAddress" ALTER COLUMN "kind" TYPE "AddressKind_new" USING ("kind"::text::"AddressKind_new");
ALTER TYPE "AddressKind" RENAME TO "AddressKind_old";
ALTER TYPE "AddressKind_new" RENAME TO "AddressKind";
DROP TYPE "public"."AddressKind_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('AWAITING_PAYMENT', 'PENDING', 'PAID', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'superAdmin';

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "fulfillmentMethod",
DROP COLUMN "productsSubtotal",
DROP COLUMN "servicesSubtotal",
DROP COLUMN "shippingCity",
DROP COLUMN "shippingFee",
DROP COLUMN "shippingPostalCode",
DROP COLUMN "shippingProvince",
DROP COLUMN "shippingStreet",
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryMode" "DeliveryMode",
ADD COLUMN     "deliveryPostalCode" TEXT,
ADD COLUMN     "deliveryProvince" TEXT,
ADD COLUMN     "deliveryStreet" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "productsStatus" "ProductsStatus";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "unitPrice",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'TO_SCHEDULE';

-- DropTable
DROP TABLE "OrderItem";

-- DropEnum
DROP TYPE "FulfillmentMethod";

-- CreateTable
CREATE TABLE "OrderProduct" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderProduct_orderId_idx" ON "OrderProduct"("orderId");

-- CreateIndex
CREATE INDEX "OrderProduct_productSlug_idx" ON "OrderProduct"("productSlug");

-- CreateIndex
CREATE INDEX "Service_status_scheduledFor_idx" ON "Service"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "OrderProduct" ADD CONSTRAINT "OrderProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
