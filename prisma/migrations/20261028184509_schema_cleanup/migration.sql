-- DropIndex
DROP INDEX "Group_name_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billedToEmail" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Order" o
SET "billedToEmail" = u.email
FROM "User" u
WHERE u.id = o."billedToId";