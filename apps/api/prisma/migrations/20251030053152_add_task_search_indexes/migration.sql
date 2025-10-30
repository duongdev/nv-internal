-- Add indexes for enhanced task search and filter performance
--
-- IMPORTANT: This migration is designed for PostgreSQL text search features
-- that Prisma schema cannot express directly:
-- 1. GIN indexes with pg_trgm for Vietnamese accent-insensitive search
-- 2. Partial indexes with WHERE clauses
-- 3. Composite indexes with DESC ordering
--
-- Note: Standard indexes (without special operators/clauses) should be in schema.prisma
--
-- Production Deployment Note:
-- For production databases, run these CREATE INDEX commands manually with CONCURRENTLY
-- to avoid locking tables during index creation. Remove CONCURRENTLY for dev/shadow DB.

-- Enable pg_trgm extension for text search (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite index for customer ID + creation date (customer task history)
-- Uses partial index (WHERE clause) - not expressible in Prisma schema
CREATE INDEX IF NOT EXISTS "Task_customerId_createdAt_idx" ON "Task" ("customerId", "createdAt" DESC) WHERE "customerId" IS NOT NULL;

-- GIN indexes for Vietnamese text search with pg_trgm
-- These enable accent-insensitive fuzzy matching - not expressible in Prisma schema
CREATE INDEX IF NOT EXISTS "Customer_phone_gin_idx" ON "Customer" USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Customer_name_gin_idx" ON "Customer" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Task_title_gin_idx" ON "Task" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "GeoLocation_address_gin_idx" ON "GeoLocation" USING GIN (address gin_trgm_ops);

-- Note: scheduledAt index will be created in a later migration after the column is added