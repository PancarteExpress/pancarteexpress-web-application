-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('fr', 'en');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'fr';
