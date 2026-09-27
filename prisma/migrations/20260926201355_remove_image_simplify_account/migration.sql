/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('residential', 'commercial');

-- CreateEnum
CREATE TYPE "AddressKind" AS ENUM ('address', 'terrain');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('installation', 'removal', 'correction');

-- DropIndex
DROP INDEX "Account_provider_providerAccountId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fulfillmentMethod" "FulfillmentMethod",
    "shippingStreet" TEXT,
    "shippingCity" TEXT,
    "shippingPostalCode" TEXT,
    "shippingProvince" TEXT,
    "productsSubtotal" INTEGER NOT NULL,
    "servicesSubtotal" INTEGER NOT NULL,
    "shippingFee" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tps" INTEGER NOT NULL,
    "tvq" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddress" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "kind" "AddressKind" NOT NULL,
    "streetNumber" TEXT,
    "streetName" TEXT,
    "apartment" TEXT,
    "postalCode" TEXT,
    "description" TEXT,
    "nearbyAddress" TEXT,
    "city" TEXT NOT NULL,

    CONSTRAINT "ServiceAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "serviceAddressId" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "Order"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "ServiceRequest_orderId_idx" ON "ServiceRequest"("orderId");

-- CreateIndex
CREATE INDEX "ServiceAddress_serviceRequestId_idx" ON "ServiceAddress"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceAddress_city_idx" ON "ServiceAddress"("city");

-- CreateIndex
CREATE INDEX "Service_serviceAddressId_idx" ON "Service"("serviceAddressId");

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddress" ADD CONSTRAINT "ServiceAddress_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_serviceAddressId_fkey" FOREIGN KEY ("serviceAddressId") REFERENCES "ServiceAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
