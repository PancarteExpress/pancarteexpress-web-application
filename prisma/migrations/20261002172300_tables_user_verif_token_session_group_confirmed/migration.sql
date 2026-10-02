/*
  Warnings:

  - You are about to drop the column `userId` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `productId` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('SOLO', 'PENDING', 'JOINED');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupStatus" "GroupStatus" NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerAccountId" TEXT;

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "userId";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Product";

-- CreateIndex
CREATE INDEX "User_groupStatus_idx" ON "User"("groupStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerAccountId_key" ON "User"("provider", "providerAccountId");
