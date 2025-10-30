-- DropIndex (old individual field indexes - replaced by searchableText)
DROP INDEX "public"."Customer_name_gin_idx";

-- DropIndex
DROP INDEX "public"."Customer_phone_gin_idx";

-- DropIndex
DROP INDEX "public"."GeoLocation_address_gin_idx";

-- DropIndex
DROP INDEX "public"."Task_title_gin_idx";

-- AlterTable (add searchableText columns)
ALTER TABLE "Customer" ADD COLUMN     "searchableText" TEXT;

-- AlterTable
ALTER TABLE "GeoLocation" ADD COLUMN     "searchableText" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "searchableText" TEXT;

-- Enable pg_trgm extension for partial text matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for Vietnamese accent-insensitive partial text search
-- These indexes use pg_trgm for efficient LIKE/ILIKE and similarity queries
-- Note: CONCURRENTLY cannot be used in migrations (requires separate transaction)
-- For production, consider creating these indexes separately with CONCURRENTLY to avoid table locks

-- Task searchableText index
CREATE INDEX IF NOT EXISTS "Task_searchableText_gin_idx"
  ON "public"."Task" USING GIN ("searchableText" gin_trgm_ops);

-- Customer searchableText index
CREATE INDEX IF NOT EXISTS "Customer_searchableText_gin_idx"
  ON "public"."Customer" USING GIN ("searchableText" gin_trgm_ops);

-- GeoLocation searchableText index
CREATE INDEX IF NOT EXISTS "GeoLocation_searchableText_gin_idx"
  ON "public"."GeoLocation" USING GIN ("searchableText" gin_trgm_ops);
