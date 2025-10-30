-- This migration:
-- 1. Adds scheduledAt field to Task model
-- 2. Consolidates standard indexes (managed by Prisma schema)
-- 3. Recreates GIN indexes for text search (manually managed)
--
-- Standard indexes are now defined in schema.prisma and managed by Prisma.
-- GIN indexes require PostgreSQL-specific operators and must be manually managed.

-- DropIndex (temporarily drop GIN indexes to recreate them)
DROP INDEX "public"."Customer_name_gin_idx";

-- DropIndex
DROP INDEX "public"."Customer_phone_gin_idx";

-- DropIndex
DROP INDEX "public"."GeoLocation_address_gin_idx";

-- DropIndex
DROP INDEX "public"."Task_title_gin_idx";

-- AlterTable: Add scheduledAt field for planned/scheduled task dates
ALTER TABLE "Task" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex: Standard indexes (managed by Prisma schema)
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "GeoLocation_address_idx" ON "GeoLocation"("address");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_customerId_idx" ON "Task"("customerId");

-- CreateIndex
CREATE INDEX "Task_status_createdAt_idx" ON "Task"("status", "createdAt");

-- Recreate GIN indexes for Vietnamese text search (manually managed)
-- These enable accent-insensitive fuzzy matching with pg_trgm
CREATE INDEX IF NOT EXISTS "Customer_phone_gin_idx" ON "Customer" USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Customer_name_gin_idx" ON "Customer" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Task_title_gin_idx" ON "Task" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "GeoLocation_address_gin_idx" ON "GeoLocation" USING GIN (address gin_trgm_ops);

-- Partial index for scheduledAt (manually managed - Prisma doesn't support WHERE clauses)
CREATE INDEX IF NOT EXISTS "Task_scheduledAt_idx" ON "Task" ("scheduledAt") WHERE "scheduledAt" IS NOT NULL;
