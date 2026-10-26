ALTER TABLE "Service" ADD COLUMN "price" INTEGER;
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");