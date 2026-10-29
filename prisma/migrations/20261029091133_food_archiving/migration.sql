-- DropIndex
DROP INDEX "FoodItem_createdById_idx";

-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "FoodItem_createdById_archivedAt_idx" ON "FoodItem"("createdById", "archivedAt");
