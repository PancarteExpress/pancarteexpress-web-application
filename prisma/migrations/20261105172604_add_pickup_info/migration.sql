-- CreateEnum
CREATE TYPE "PickupMode" AS ENUM ('ADDRESS', 'WAREHOUSE');

-- CreateTable
CREATE TABLE "PickupInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PickupMode" NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "receptionDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickupInfo_userId_key" ON "PickupInfo"("userId");

-- AddForeignKey
ALTER TABLE "PickupInfo" ADD CONSTRAINT "PickupInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
