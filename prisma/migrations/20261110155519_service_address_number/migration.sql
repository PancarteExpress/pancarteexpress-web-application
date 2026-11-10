/*
  Warnings:

  - A unique constraint covering the columns `[addressNumber]` on the table `ServiceAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ServiceAddress" ADD COLUMN     "addressNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAddress_addressNumber_key" ON "ServiceAddress"("addressNumber");

-- Démarre la numérotation à 11111 (le prochain nextval renverra 11111)
SELECT setval(pg_get_serial_sequence('"ServiceAddress"', 'addressNumber'), 11110);

-- Renumérote les adresses fictives existantes (elles ont reçu 1, 2, 3…)
UPDATE "ServiceAddress"
SET "addressNumber" = nextval(pg_get_serial_sequence('"ServiceAddress"', 'addressNumber'));