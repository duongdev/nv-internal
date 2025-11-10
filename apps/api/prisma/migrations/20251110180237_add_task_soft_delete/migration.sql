-- DropIndex
DROP INDEX "public"."Customer_searchableText_gin_idx";

-- DropIndex
DROP INDEX "public"."GeoLocation_searchableText_gin_idx";

-- DropIndex
DROP INDEX "public"."Task_searchableText_gin_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "searchableText" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Task_deletedAt_status_idx" ON "Task"("deletedAt", "status");

-- CreateIndex
CREATE INDEX "Task_deletedAt_createdAt_idx" ON "Task"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Task_deletedAt_customerId_idx" ON "Task"("deletedAt", "customerId");

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");
