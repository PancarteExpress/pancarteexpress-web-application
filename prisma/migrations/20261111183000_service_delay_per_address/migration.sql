-- Délai par adresse : delay et requestedDate passent de ServiceRequest à ServiceAddress.
-- Écrite à la main pour RECOPIER le délai des commandes existantes avant de supprimer l'ancienne colonne
-- (la migration générée automatiquement perdrait ces données).

-- 1. Nouvelles colonnes sur les adresses
ALTER TABLE "ServiceAddress" ADD COLUMN "delay" "ServiceDelay";
ALTER TABLE "ServiceAddress" ADD COLUMN "requestedDate" DATE;

-- 2. Chaque adresse reçoit le délai de sa demande
UPDATE "ServiceAddress" AS a
SET "delay" = r."delay",
    "requestedDate" = r."requestedDate"
FROM "ServiceRequest" AS r
WHERE a."serviceRequestId" = r."id";

-- 3. Anciennes colonnes de la demande
ALTER TABLE "ServiceRequest" DROP COLUMN "delay";
ALTER TABLE "ServiceRequest" DROP COLUMN "requestedDate";
