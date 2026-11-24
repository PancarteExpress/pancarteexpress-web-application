/*
  Warnings:

  - You are about to drop the `ContactAttempt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ContactAttempt";

-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitAttempt_action_key_createdAt_idx" ON "RateLimitAttempt"("action", "key", "createdAt");
