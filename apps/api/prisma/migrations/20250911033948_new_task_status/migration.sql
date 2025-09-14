/*
  Warnings:

  - The values [PENDING] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TaskStatus_new" AS ENUM ('READY', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Task" ALTER COLUMN "status" TYPE "public"."TaskStatus_new" USING ("status"::text::"public"."TaskStatus_new");
ALTER TYPE "public"."TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "public"."TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "public"."Task" ALTER COLUMN "status" SET DEFAULT 'READY';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'READY';
