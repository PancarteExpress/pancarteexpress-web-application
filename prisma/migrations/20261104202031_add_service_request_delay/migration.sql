-- CreateEnum
CREATE TYPE "ServiceDelay" AS ENUM ('standard24h', 'urgent12h', 'sameDay', 'specificDate');

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "delay" "ServiceDelay" NOT NULL DEFAULT 'standard24h',
ADD COLUMN     "requestedDate" DATE;
